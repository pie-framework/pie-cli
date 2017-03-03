import * as express from 'express';
import * as http from 'http';
import * as jsesc from 'jsesc';
import * as pug from 'pug';
import * as webpack from 'webpack';
import * as webpackMiddleware from 'webpack-dev-middleware';

import AllInOneBuild, { ControllersBuild, SupportConfig } from '../../question/build/all-in-one';
import { App, Servable, ServeOpts } from '../types';
import AppServer, { utils as su } from '../../server';
import { Names, clientDependencies, getNames } from '../common';
import { basename, join, resolve } from 'path';
import { existsSync, readFileSync, readJsonSync } from 'fs-extra';

import { ElementDeclaration } from './../../code-gen/declaration';
import { JsonConfig } from '../../question/config';
import { buildLogger } from 'log-factory';
import entryJs from './entry';
import { info } from './../../package-info/index';
import { writeConfig } from '../../code-gen/webpack-write-config';

const logger = buildLogger();
const templatePath = join(__dirname, 'views/index.pug');

export default class InfoApp implements App, Servable {

  public static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<App> {

    const dir = resolve(args.dir || process.cwd());

    if (!existsSync(join(dir, 'docs/demo'))) {
      throw new Error(`Can't find a 'docs/demo' directory in path: ${dir}. Is this a pie directory?`);
    }

    const config = new JsonConfig(join(dir, 'docs/demo'));

    return loadSupport(config)
      .then((s) => {
        return new InfoApp(args, dir, config, s, getNames(args));
      });
  }

  private allInOneBuild: AllInOneBuild;
  private controllersBuild: ControllersBuild;
  private template: any;

  constructor(private args: any,
    private pieRoot: string,
    readonly config: JsonConfig,
    private support: SupportConfig,
    private names: Names) {

    this.allInOneBuild = new AllInOneBuild(
      config,
      support,
      this.names.build.entryFile,
      this.names.out.completeItemTag.path,
      this.args.writeWebpackConfig !== false);

    this.controllersBuild = new ControllersBuild(config, false);

    this.template = pug.compileFile(templatePath);
  }

  /**
   * Also watch the README and the package.json
   */
  public watchableFiles(): string[] {
    return [
      resolve(join(this.pieRoot, 'README.md')),
      resolve(join(this.pieRoot, 'package.json')),
    ]
  }

  public clean(): Promise<any> {
    return null;
  }

  public async server(opts: ServeOpts): Promise<{
    server: http.Server,
    reload: (n: string) => void
  }> {
    logger.silly('[server] opts:', opts);
    await this.install(opts.forceInstall);


    /**
     * TODO: We're only picking up the configuration element for this pie.
     * It could be that the demo item may link to other local pies, 
     * in which case we should be pulling in those configuration elements also.
     */
    let configurationDir = join(this.pieRoot, 'configuration');
    let configurationPackage = join(configurationDir, 'package.json');

    let declarations = this.config.declarations;
    let configurationMap = null;
    if (existsSync(configurationPackage)) {
      let pkg = readJsonSync(configurationPackage, 'utf8');
      logger.debug('found configuration package .. adding it to bundle');
      let configDeclaration = new ElementDeclaration(pkg.name, configurationDir);
      declarations = declarations.concat([configDeclaration]);
      configurationMap = {}
      let pieName = basename(this.pieRoot);
      configurationMap[pieName] = pkg.name;
    }

    const js = entryJs(
      declarations,
      this.controllersBuild.controllerDependencies,
      AppServer.SOCK_PREFIX,
      configurationMap);

    const config = this.allInOneBuild.webpackConfig(js);

    config.resolve.modules.push(resolve(join(__dirname, '../../../node_modules')));
    config.resolveLoader.modules.push(resolve(join(__dirname, '../../../node_modules')));


    const cssRule = config.module.rules.find((r) => {
      const match = r.test.source === '\\.css$';
      return match;
    });

    cssRule.exclude = [
      /.*highlight\.js.*/,
    ];

    // load in raw css for markdown element
    config.module.rules = [{
      test: /.*\/highlight\.js\/styles\/default\.css$/,
      use: [
        'raw-loader',
      ],
    }].concat(config.module.rules);

    writeConfig(join(this.config.dir, 'info.config.js'), config);

    const compiler = webpack(config);
    const r = this.router(compiler);
    const app = express();
    app.use(r);

    const server = new AppServer(app);

    /** Note: delay linking the compiler to give it time to flush out the initial compilations */
    setTimeout(() => {
      su.linkCompilerToServer('main', compiler, server);
    }, 5000);

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
      noInfo: true,
      publicPath: '/'
    });

    middleware.waitUntilValid(function () {
      logger.info('[middleware] ---> Package is in a valid state');
    });

    router.use(middleware);

    router.get('/', (req, res) => {

      const pkg = readJsonSync(join(this.pieRoot, 'package.json'));
      const readme = readFileSync(join(this.pieRoot, 'README.md'), 'utf8');

      const page = this.template({

        demo: {
          config: {
            models: this.config.pieModels
          },
          markup: jsesc(this.config.markup),
        },
        element: {
          github: {},
          org: '',
          package: pkg,
          readme,
          repo: pkg.name,
          tag: pkg.version
        },
        js: [
          '//cdn.jsdelivr.net/sockjs/1/sockjs.min.js',
          this.allInOneBuild.fileout,
        ],
        orgRepo: {
          repo: pkg.name,
        }
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
