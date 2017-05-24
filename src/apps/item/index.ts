import * as express from 'express';
import * as jsesc from 'jsesc';
import * as pug from 'pug';
import * as webpack from 'webpack';
import * as webpackMiddleware from 'webpack-dev-middleware';

import { App, Servable, ServeOpts, ServeResult } from '../types';
import AppServer, { linkCompilerToServer } from '../../server';
import { join, resolve } from 'path';
import { writeConfig, writeEntryJs } from '../../code-gen';

import Install from '../../install';
import { JsonConfig } from '../../question/config';
import { SupportConfig } from '../../framework-support';
import { buildLogger } from 'log-factory';
import entryJs from './entry';
import { webpackConfig } from '../common';

const logger = buildLogger();
const templatePath = join(__dirname, 'views/index.pug');

export default class ItemApp implements App, Servable {

  public static generatedFiles: string[] = [];

  public static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<App> {

    const dir = resolve(args.dir || process.cwd());
    const config = JsonConfig.build(dir, args);

    return loadSupport(config)
      .then((s) => {
        return new ItemApp(args, config, s);
      });
  }

  private static BUNDLE: string = 'item.bundle.js';
  private static ENTRY: string = 'item.entry.js';

  private template: any;
  private installer: Install;

  constructor(private args: any,
    readonly config: JsonConfig,
    private support: SupportConfig) {

    this.installer = new Install(config);

    this.template = pug.compileFile(templatePath);
  }

  public watchableFiles(): string[] {
    return [];
  }

  public async server(opts: ServeOpts): Promise<ServeResult> {
    logger.silly('[server] opts:', opts);
    const mappings = await this.installer.install(opts.forceInstall);

    const js = entryJs(
      this.config.declarations,
      mappings.controllers,
      AppServer.SOCK_PREFIX);

    await writeEntryJs(join(this.installer.dirs.root, ItemApp.ENTRY), js);

    logger.info('add sourceMaps? ', opts.sourceMaps);

    const config = webpackConfig(
      this.installer,
      this.support,
      ItemApp.ENTRY,
      ItemApp.BUNDLE,
      this.config.dir,
      opts.sourceMaps);

    writeConfig(join(this.installer.dirs.root, 'item.webpack.config.js'), config);

    const compiler = webpack(config);
    const r = this.router(compiler);
    const app = express();
    app.use(r);

    const server = new AppServer(app);

    linkCompilerToServer('main', compiler, server);

    const reload = (name) => {
      logger.info('File Changed: ', name);
      this.config.reload();
      server.reload(name);
    };

    return {
      dirs: this.installer.dirs,
      mappings,
      reload,
      server: server.httpServer
    };
  }

  private router(compiler: webpack.Compiler): express.Router {

    const router = express.Router();

    const middleware = webpackMiddleware(compiler, {
      noInfo: true,
      publicPath: '/',
      quiet: true
    });

    middleware.waitUntilValid(() => {
      logger.info('[middleware] ---> Package is in a valid state');
    });

    router.use(middleware);

    router.get('/', (req, res) => {

      const page = this.template({
        css: this.support.externals.css,
        demo: {
          config: {
            langs: this.config.langs,
            models: this.config.models()
          },
          markup: jsesc(this.config.markup),
        },
        js: this.support.externals.js.concat([
          '//cdn.jsdelivr.net/sockjs/1/sockjs.min.js',
          `/${ItemApp.BUNDLE}`
        ]),
      });

      res
        .set('Content-Type', 'text/html')
        .status(200)
        .send(page);
    });

    router.use(express.static(this.config.dir));
    return router;
  }
}
