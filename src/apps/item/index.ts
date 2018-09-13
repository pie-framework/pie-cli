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
import { Session } from '../../question/session';

const logger = buildLogger();
const templatePath = join(__dirname, 'views/index.pug');

export default class ItemApp implements App, Servable {
  public static generatedFiles: string[] = [];

  public static build(
    args: any,
    loadSupport: (JsonConfig) => Promise<SupportConfig>
  ): Promise<App> {
    const dir = resolve(args.dir || process.cwd());
    const config = JsonConfig.build(dir, args);
    const session = Session.build(dir, args);

    return loadSupport(config).then(support => {
      return new ItemApp(config, support, session);
    });
  }

  private static BUNDLE: string = 'item.bundle.js';
  private static ENTRY: string = 'item.entry.js';

  private template: any;
  private installer: Install;

  constructor(
    readonly config: JsonConfig,
    private support: SupportConfig,
    readonly session?: Session
  ) {
    this.installer = new Install(config.dir, config.raw);

    this.template = pug.compileFile(templatePath);
  }

  public watchableFiles(): string[] {
    return [];
  }

  public async server(opts: ServeOpts): Promise<ServeResult> {
    logger.silly('[server] opts:', opts);
    const { dirs, pkgs } = await this.installer.install(opts.forceInstall);

    const js = entryJs(pkgs, AppServer.SOCK_PREFIX);

    await writeEntryJs(join(dirs.root, ItemApp.ENTRY), js);

    logger.info('add sourceMaps? ', opts.sourceMaps);

    const config = webpackConfig(
      [dirs.root, dirs.controllers],
      dirs.root,
      this.support,
      ItemApp.ENTRY,
      ItemApp.BUNDLE,
      this.config.dir,
      opts.sourceMaps
    );

    writeConfig(join(dirs.root, 'item.webpack.config.js'), config);

    const compiler = webpack(config);
    const r = this.router(compiler);
    const app = express();
    app.use(r);

    const server = new AppServer(app);

    linkCompilerToServer('main', compiler, server);

    const reload = name => {
      logger.info('File Changed: ', name);
      this.config.reload();
      this.session.reload();
      server.reload(name);
    };

    return {
      dirs,
      pkgs,
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
          session: this.session.array
        },
        js: this.support.externals.js.concat([
          '//cdn.jsdelivr.net/sockjs/1/sockjs.min.js',
          `/${ItemApp.BUNDLE}`
        ])
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
