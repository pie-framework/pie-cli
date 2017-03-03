import * as express from 'express';
import * as http from 'http';
import * as jsesc from 'jsesc';
import * as pug from 'pug';
import * as webpack from 'webpack';
import * as webpackMiddleware from 'webpack-dev-middleware';

import AllInOneBuild, { ControllersBuild, SupportConfig } from '../../question/build/all-in-one';
import { App, Servable, ServeOpts } from '../types';
import AppServer, { utils as su } from '../../server';
import { Names, getNames } from "../common";
import { existsSync, readFileSync, readJsonSync } from 'fs-extra';
import { join, resolve } from 'path';

import { JsonConfig } from '../../question/config';
import { buildLogger } from 'log-factory';
import entryJs from './entry';
import { writeConfig } from '../../code-gen/webpack-write-config';

const logger = buildLogger();
const templatePath = join(__dirname, 'views/index.pug');

const clientDependencies = (args: any) => args.configuration.app.dependencies;

export default class ItemApp implements App, Servable {

  public static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<App> {

    const dir = resolve(args.dir || process.cwd());
    const config = new JsonConfig(dir);

    return loadSupport(config)
      .then((s) => {
        return new ItemApp(args, config, s, getNames(args));
      });
  }

  private allInOneBuild: AllInOneBuild;
  private controllersBuild: ControllersBuild;
  private template: any;

  constructor(private args: any,
    readonly config: JsonConfig,
    private support: SupportConfig,
    private names: Names) {

    this.allInOneBuild = new AllInOneBuild(
      config,
      support,
      this.names.build.entryFile,
      this.names.out.completeItemTag.path,
      this.args.writeWebpackConfig !== false);

    this.controllersBuild = this.allInOneBuild.controllers;

    this.template = pug.compileFile(templatePath);
  }

  public clean() {
    return null;
  }

  public watchableFiles(): string[] {
    return [];
  }

  public async server(opts: ServeOpts): Promise<{
    server: http.Server,
    reload: (n: string) => void
  }> {
    logger.silly('[server] opts:', opts);
    await this.install(opts.forceInstall);

    const js = entryJs(
      this.config.declarations,
      this.controllersBuild.controllerDependencies,
      AppServer.SOCK_PREFIX);

    const config = this.allInOneBuild.webpackConfig(js);

    config.resolve.modules.push(resolve(join(__dirname, '../../../node_modules')));
    config.resolveLoader.modules.push(resolve(join(__dirname, '../../../node_modules')));

    //writeConfig(join(this.config.dir, 'info.config.js'), config);

    const compiler = webpack(config);
    const r = this.router(compiler);
    const app = express();
    app.use(r);

    const server = new AppServer(app);

    su.linkCompilerToServer('main', compiler, server);

    const reload = (name) => {
      logger.info('File Changed: ', name);
      this.config.reload();
      server.reload(name);
    };

    return { server: server.httpServer, reload };
  }

  private router(compiler: webpack.Compiler): express.Router {

    const router = express.Router();

    const middleware = webpackMiddleware(compiler, {
      noInfo: false,
      publicPath: '/'
    });

    middleware.waitUntilValid(function () {
      logger.info('[middleware] ---> Package is in a valid state');
    });

    router.use(middleware);

    router.get('/', (req, res) => {

      const page = this.template({

        demo: {
          config: {
            models: this.config.pieModels
          },
          markup: jsesc(this.config.markup),
        },
        js: [
          '//cdn.jsdelivr.net/sockjs/1/sockjs.min.js',
          this.allInOneBuild.fileout
        ]
      });

      res
        .set('Content-Type', 'text/html')
        .status(200)
        .send(page);
    });

    router.use(express.static(this.config.dir));
    return router;
  }

  private async install(forceInstall: boolean): Promise<void> {
    await this.allInOneBuild.install({
      dependencies: clientDependencies(this.args),
      devDependencies: this.support.npmDependencies || {},
    }, forceInstall);
  }
}
