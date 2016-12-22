import { App, BuildOpts, BuildResult, ManifestOpts } from '../types';
import { JsonConfig, Manifest, Declaration, ElementDeclaration } from '../../question/config';
import AllInOneBuild, { ClientBuild, ControllersBuild, SupportConfig } from '../../question/build/all-in-one';
import { KeyMap } from '../../npm/types';
import { join, relative, resolve } from 'path';
import { buildLogger, getLogger } from '../../log-factory';
import * as _ from 'lodash';
import * as pug from 'pug';
import * as jsesc from 'jsesc';
import { writeFileSync, remove } from 'fs-extra';
import * as express from 'express';
import * as webpackMiddleware from 'webpack-dev-middleware';
import * as webpack from 'webpack';
import * as http from 'http';
import { ReloadOrError, HasServer } from '../server/types';
import * as bundled from './elements/bundled';

export type Compiler = webpack.compiler.Compiler;

const logger = buildLogger();
const builderLogger = getLogger('BUILD');
const templatePath = join(__dirname, 'views/example.pug');

export function logBuild<T>(name: string, p: Promise<T>): Promise<T> {
  let start = new Date().getTime();
  builderLogger.info(`build ${name}`);
  return p.then(r => {
    let duration = new Date().getTime() - start;
    builderLogger.info(`build ${name} complete - duration: ${duration} ms`);
    return r;
  });
}

let clientDependencies = (args: any) => args.configuration.app.dependencies;

type BuildNames = {
  entryFile: string;
  bundledItem: Tag;
  controllersMap: string;
}


export class Tag {
  constructor(readonly name: string, readonly path?: string) {
    this.path = this.path || `./${this.name}.js`;
  }
  get tag(): string {
    return `<${this.name}></${this.name}>`;
  }
}

export class Out {
  constructor(
    readonly completeItemTag: Tag = new Tag('pie-item'),
    readonly viewElements: string = 'pie-view.js',
    readonly controllers: string = 'pie-controller.js',
    readonly example: string = 'example.html') { }

  static build(args) {
    return new Out(
      args.questionItemTagName ? new Tag(args.questionItemTagName) : undefined,
      args.questionElements,
      args.questionControllers,
      args.questionExample
    )
  }
}

export type Names = {
  build: BuildNames,
  out: Out
}

export let getNames = (args: any): Names => {
  return {
    build: {
      entryFile: './.all-in-one.entry.js',
      bundledItem: new Tag('bundled-item', './.bundled-item.js'),
      controllersMap: './.controllers-map.js'
    },
    out: Out.build(args)
  }
}

export let build = (
  args: any,
  loadSupport: (JsonConfig) => Promise<SupportConfig>,
  mkApp: (JsonConfig, SupportConfig, Names) => App): Promise<App> => {
  let dir = resolve(args.dir || process.cwd());
  let config = new JsonConfig(dir);
  return loadSupport(config)
    .then(s => {
      let names = getNames(args);
      return mkApp(config, s, names);
    });
}

type BuildStep = { label: string, fn: () => Promise<string[]> };

export abstract class BaseApp implements App {

  protected allInOneBuild: AllInOneBuild;
  protected branch: string;

  constructor(
    private args: any,
    readonly config: JsonConfig,
    protected support: SupportConfig,
    readonly names: Names) {
    this.branch = args.pieBranch || process.env.PIE_BRANCH || 'develop';

    this.allInOneBuild = new AllInOneBuild(
      config,
      support,
      this.names.build.entryFile,
      this.names.out.completeItemTag.path,
      this.args.writeWebpackConfig !== false);
  }

  protected logBuild(name: string): void {
    logger.info(`[build] building ${name}`);
  }

  /**
   * A set of build steps to be executed serially...
   */
  protected get buildSteps(): BuildStep[] {
    return [
      { label: this.names.out.completeItemTag.path, fn: this.buildAllInOne }
    ];
  }

  protected async buildAllInOne(): Promise<string[]> {
    let src = this.prepareWebpackJs();
    let out = await this.allInOneBuild.build(src);
    logger.info(`build: ${this.names.out.example}`);
    let example = this.buildExample();
    return [out.file, example];
  }

  async build(opts: BuildOpts): Promise<string[]> {

    await logBuild('install', this.install());

    let files = await _.reduce(this.buildSteps, (acc, bs) => {
      return acc.then(f => {
        return logBuild(bs.label, bs.fn.bind(this)()).then(bsf => _.concat(f, bsf));
      });
    }, Promise.resolve([]));

    if (!opts.keepBuildAssets) {
      await logBuild('remove build assets...', this.removeBuildAssets());
    }

    return files;
  }

  protected abstract mkServer(app: express.Application): ReloadOrError & HasServer;

  async server(): Promise<{ server: http.Server, reload: (string) => void }> {
    await logBuild('install', this.install());
    let src = this.prepareWebpackJs();
    let config = this.allInOneBuild.webpackConfig(src);
    let compiler = webpack(config);
    let r = this.router(compiler);
    let app = express();
    app.use(r);
    let server = this.mkServer(app);
    this._linkCompilerToServer('main', compiler, server);

    let reload = (name) => {
      logger.info('File Changed: ', name);

      if (name === join(this.config.dir, this.config.filenames.json)
        || name === join(this.config.dir, this.config.filenames.markup)) {
        this.config.reload();
        this.writeBundledItem();
      }
    }
    return { server: server.httpServer, reload: reload };
  }

  private writeBundledItem(): void {
    let bundledSrc = bundled.js(
      this.names.build.controllersMap,
      'pie-controller',
      this.config);
    writeFileSync(join(this.config.dir, this.names.build.bundledItem.path), bundledSrc, 'utf8');
  }

  protected get declarations(): Declaration[] {
    return _.concat([
      new ElementDeclaration('pie-player'),
      new ElementDeclaration('pie-control-panel'),
      //Note: we assign the bundled-item to the tag <pie-item>
      new ElementDeclaration(this.names.out.completeItemTag.name, this.names.build.bundledItem.path)
    ], this.config.declarations || []);
  }

  private prepareWebpackJs(): string {
    let controllerMapSrc = this.allInOneBuild.controllerMapSrc;
    writeFileSync(join(this.config.dir, this.names.build.controllersMap), controllerMapSrc, 'utf8');
    this.writeBundledItem();
    return this.allInOneBuild.js(this.declarations);
  }

  private buildExample(): string {
    let markup = this.fileMarkup();
    writeFileSync(join(this.config.dir, this.names.out.example), markup, 'utf8');
    return this.names.out.example;
  }

  /** Create markup rendering the app. */
  protected abstract fileMarkup(): string;
  /** Create markup rendering the app. */
  protected abstract serverMarkup(): string;

  private router(compiler: Compiler): express.Router {

    const router = express.Router();

    let middleware = webpackMiddleware(compiler, {
      publicPath: '/',
      noInfo: true
    });

    router.use(middleware);

    router.get('/', (req, res) => {
      let page = this.serverMarkup();
      res
        .set('Content-Type', 'text/html')
        .status(200)
        .send(page);
    });

    router.use(express.static(this.config.dir));
    return router;
  }

  protected async install(): Promise<void> {
    await this.allInOneBuild.install({
      dependencies: clientDependencies(this.args),
      devDependencies: this.support.npmDependencies || {}
    });
  }

  async manifest(opts: ManifestOpts): Promise<Manifest> {
    /** 
     * TODO: we should be adding the App's extra dependencies 
     * to give a true manifest of what's compiled.
     */
    if (opts.outfile) {
      writeFileSync(opts.outfile, this.config.manifest, 'utf8');
    }
    return this.config.manifest;
  }

  private _linkCompilerToServer(name, compiler: Compiler, handlers: ReloadOrError) {
    (compiler as any).plugin('done', (stats) => {
      process.nextTick(() => {
        if (stats.hasErrors()) {
          logger.error('recompile failed');
          let info = stats.toJson('errors-only');
          logger.error(info.errors);
          handlers.error(name, info.errors);
        } else {
          logger.debug(`${name}: reload!`);
          handlers.reload(name);
        }
      });
    });
  }

  protected get buildAssets(): string[] {
    return [
      this.names.build.bundledItem.path,
      this.names.build.controllersMap,
      this.names.build.entryFile,
      'controllers',
      'node_modules',
      'package.json'
    ];
  }

  protected get generatedAssets(): string[] {
    return [
      this.names.out.completeItemTag.path,
      this.names.out.example,
      this.names.out.viewElements,
      this.names.out.controllers];
  }

  private removeBuildAssets(): Promise<string[]> {
    return this.removeFiles(this.buildAssets);
  }

  clean(): Promise<any> {
    let files = _.concat(this.buildAssets, this.generatedAssets);
    return this.removeFiles(files);
  }

  private removeFiles(files: string[]): Promise<string[]> {
    let p = _.map(files, f => new Promise((resolve, reject) => {
      remove(join(this.config.dir, f), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(f);
        }
      });
    }));
    return Promise.all(p);
  }
};
