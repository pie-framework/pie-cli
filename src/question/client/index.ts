import { join, resolve as pathResolve } from 'path';
import FrameworkSupport, { BuildConfig } from '../../framework-support';
import { buildLogger } from '../../log-factory';
import NpmDir from '../../npm/npm-dir';
import * as _ from 'lodash';
import * as resolve from 'resolve';
import { build as buildWebpack } from '../../code-gen/webpack-builder';
import { configToJsString, writeConfig } from '../../code-gen/webpack-write-config';
import buildDependencies from '../build-dependencies';
import { BuildInfo } from '../build-info';
import { Config, JsonConfig } from '../config';
import { writeFileSync } from 'fs-extra';
import { filterFirstLevelDependencies } from '../../npm/filter-ls';
import { App } from '../../example-app';

const logger = buildLogger();

const ENTRY_JS = 'entry.js';

let clientDependencies = _.merge(buildDependencies, {
  'style-loader': '^0.13.1',
  'css-loader': '^0.25.0'
});

let baseConfig = (root) => {
  return {
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: 'style!css'
        }
      ]
    },
    resolveLoader: {
      root: pathResolve(join(root, 'node_modules')),
    },
    resolve: {
      root: pathResolve(join(root, 'node_modules')),
      extensions: ['', '.js', '.jsx']
    }
  };
};

export class BuildOpts {
  constructor(readonly bundleName, readonly pieBranch) { }

  static build(args) {
    args = args || {};
    return new BuildOpts(
      args.bundleName || 'pie.js',
      args.pieBranch || process.env.PIE_BRANCH || 'develop');
  }
}

export class ClientBuildable {
  private frameworkSupport: FrameworkSupport;
  private npmDir;
  private _supportConfig: BuildConfig;
  constructor(private config: JsonConfig, private support, private opts: BuildOpts, private app: App) {
    this.frameworkSupport = FrameworkSupport.bootstrap(support.concat(app.frameworkSupport()));
    this.npmDir = new NpmDir(this.dir);
  }

  get dir() {
    return this.config.dir;
  }

  get externals() {
    return this._supportConfig ? this._supportConfig.externals : { js: [], css: [] };
  }

  pack() {
    return this.prepareWebpackConfig()
      .then((config) => this.bundle(config));
  }

  prepareWebpackConfig() {
    return this._install()
      .then(() => {
        let isValid = this.config.valid();
        logger.silly('isConfigValid() ? ', isValid)
        return isValid ? Promise.resolve() : Promise.reject('config is invalid');
      })
      .then(() => this.writeEntryJs())
      .then(() => this.webpackConfig());
  }


  private get entryJsPath() {
    return join(this.dir, ENTRY_JS);
  }

  writeEntryJs() {
    let js = this.app.entryJs(this.config.declarations);
    logger.silly('[writeEntryJs] js: ', js);
    return writeFileSync(this.entryJsPath, js, 'utf8');
  }

  get buildInfo(): BuildInfo {
    let out = {
      dir: this.dir,
      buildOnly: [ENTRY_JS, 'node_modules', 'package.json'],
      output: [this.opts.bundleName, `${this.opts.bundleName}.map`]
    }

    logger.debug('[buildInfo]...', out);
    return out;
  }

  webpackConfig() {
    let config = _.extend({
      context: this.dir,
      entry: this.entryJsPath,
      output: { filename: this.opts.bundleName, path: this.dir }
    }, baseConfig(this.dir));

    let frameworkLoaders = this._supportConfig.webpackLoaders((k) => resolve.sync(k, { basedir: this.dir }));

    logger.silly(`frameworkLoaders: ${JSON.stringify(frameworkLoaders)}`);

    config.module.loaders = config.module.loaders.concat(frameworkLoaders);
    return Promise.resolve(config);
  }

  bundle(config) {
    logger.silly('webpack config', configToJsString(config));

    if (process.env.WRITE_WEBPACK_CONFIG) {
      writeConfig(join(this.dir, 'webpack.config.js'), config);
    }

    return buildWebpack(config)
      .then(() => {
        return config.output.filename;
      });
  }

  /**
   * Initialise _supportConfig for use in later steps;
   */
  _buildFrameworkConfig() {

    let appDependencyKeys = _.keys(this.app.dependencies(this.opts.pieBranch));
    logger.silly('[_buildFrameworkConfig] appDependencyKeys: ', appDependencyKeys);
    return this.npmDir.ls()
      .then((lsResult) => {
        let keys = _.concat(appDependencyKeys, _.keys(this.config.dependencies));
        let filtered = filterFirstLevelDependencies(lsResult, keys);
        this._supportConfig = this.frameworkSupport.buildConfigFromPieDependencies(filtered);
        logger.silly('[_buildFrameworkConfig] this._supportConfig: ', this._supportConfig);
        return this._supportConfig;
      })
      .catch((e) => {
        logger.error(e.stack);
        throw new Error(e)
      });
  }

  _install() {
    let dependencies = _.extend({},
      clientDependencies,
      this.config.dependencies,
      this.app.dependencies(this.opts.pieBranch));

    logger.silly('[_install] dependencies: ', dependencies);

    return this.npmDir.install(dependencies)
      .then(() => this._buildFrameworkConfig())
      .then(() => this._installFrameworkDependencies());
  }

  _installFrameworkDependencies() {

    logger.debug('[_installFrameworkDependencies] ...');

    if (!this._supportConfig) {
      return Promise.reject(new Error('no support config - has it been initialised?'));
    }

    logger.silly('supportConfig: ', JSON.stringify(this._supportConfig.npmDependencies));

    return this.npmDir.installMoreDependencies(this._supportConfig.npmDependencies, { save: true });
  }
}