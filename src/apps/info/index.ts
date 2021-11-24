import * as express from 'express';
import * as jsesc from 'jsesc';
import * as pug from 'pug';
import * as webpack from 'webpack';
import * as webpackMiddleware from 'webpack-dev-middleware';

import { App, Servable, ServeOpts, ServeResult } from '../types';
import AppServer, { linkCompilerToServer } from '../../server';
import { existsSync, readFileSync, readJsonSync } from 'fs-extra';
import { join, resolve } from 'path';
import { writeConfig, writeEntryJs } from '../../code-gen';

import Install from '../../install';
import { JsonConfig } from '../../question/config';
import { SupportConfig } from './../../framework-support';
import { buildLogger } from 'log-factory';
import entryJs from './entry';
import { webpackConfig } from '../common';
import { Session } from '../../question/session';

const logger = buildLogger();
const templatePath = join(__dirname, 'views/index.pug');

export default class InfoApp implements App, Servable {
  public static generatedFiles: string[] = [];

  public static build(
    args: any,
    loadSupport: (JsonConfig) => Promise<SupportConfig>
  ): Promise<App> {
    const dir = resolve(args.dir || process.cwd());

    if (!existsSync(join(dir, 'docs/demo'))) {
      throw new Error(
        `Can't find a 'docs/demo' directory in path: ${dir}. Is this a pie directory?`
      );
    }

    const config = JsonConfig.build(join(dir, 'docs/demo'), args);
    const session = Session.build(join(dir, 'docs/demo'), args);

    return loadSupport(config).then(
      (support) => new InfoApp(dir, config, support, session)
    );
  }

  private static BUNDLE = 'info.bundle.js';
  private static ENTRY = 'info.entry.js';

  private template: any;
  private installer: Install;

  constructor(
    private pieRoot: string,
    readonly config: JsonConfig,
    private support: SupportConfig,
    readonly session: Session
  ) {
    this.template = pug.compileFile(templatePath);

    this.installer = new Install(config.dir, config.raw);
  }

  /**
   * Also watch the README and the package.json
   */
  public watchableFiles(): string[] {
    return [
      resolve(join(this.pieRoot, 'README.md')),
      resolve(join(this.pieRoot, 'package.json')),
    ];
  }

  public async server(opts: ServeOpts): Promise<ServeResult> {
    logger.silly('[server] opts:', opts);
    const { dirs, pkgs } = await this.installer.install(opts.forceInstall);

    const js = entryJs(pkgs, AppServer.SOCK_PREFIX);

    await writeEntryJs(join(dirs.root, InfoApp.ENTRY), js);

    const resolveModules = [dirs.root, dirs.configure, dirs.controllers];
    const config = webpackConfig(
      resolveModules,
      dirs.root,
      this.support,
      InfoApp.ENTRY,
      InfoApp.BUNDLE,
      null,
      opts.sourceMaps
    );

    const cssRule = config.module.rules.find((u) => {
      const match = u.test.source === '\\.css$';
      return match;
    });

    cssRule.exclude = [/.*highlight\.js.*/];

    // load in raw css for markdown element
    config.module.rules = [
      {
        test: /.*highlight\.js.*default\.css$/,
        use: ['raw-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
            },
          },
        ],
      },
    ].concat(config.module.rules);

    writeConfig(join(dirs.root, 'info.webpack.config.js'), config);

    const compiler = webpack(config);
    const r = this.router(compiler);
    const app = express();
    app.use(r);

    const server = new AppServer(app);

    linkCompilerToServer('main', compiler, server);

    const reload = (name) => {
      logger.info('File Changed: ', name);
      this.config.reload();
      this.session.reload();
      server.reload(name);
    };

    return {
      dirs,
      pkgs,
      reload,
      server: server.httpServer,
    };
  }

  private router(compiler: webpack.Compiler): express.Router {
    const router = express.Router();

    const middleware = webpackMiddleware(compiler, {
      noInfo: true,
      publicPath: '/',
      quiet: true,
    });

    middleware.waitUntilValid(() => {
      logger.info('[middleware] ---> Package is in a valid state');
    });

    router.use(middleware);

    router.get('/', (req, res) => {
      const pkg = readJsonSync(join(this.pieRoot, 'package.json'));
      const readme = readFileSync(join(this.pieRoot, 'README.md'), 'utf8');

      const params = {
        demo: {
          config: {
            langs: this.config.langs,
            models: this.config.models(),
          },
          markup: jsesc(this.config.markup),
          session: this.session.array,
        },
        element: {
          github: {},
          org: '',
          package: pkg,
          readme,
          repo: pkg.name,
          tag: pkg.version,
        },
        js: this.support.externals.js.concat([
          '//unpkg.com/@webcomponents/webcomponentsjs@2.0.0/webcomponents-loader.js',
          '//cdn.jsdelivr.net/sockjs/1/sockjs.min.js',
          `/${InfoApp.BUNDLE}`,
        ]),
        orgRepo: {
          repo: pkg.name,
        },
      };

      if (process.env.NODE_ENV === 'development') {
        this.template = pug.compileFile(templatePath);
      }

      const page = this.template(params);
      res.set('Content-Type', 'text/html').status(200).send(page);
    });

    router.use(express.static(this.config.dir));
    return router;
  }
}
