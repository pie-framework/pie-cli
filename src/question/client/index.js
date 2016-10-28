import path from 'path';
import FrameworkSupport from '../../framework-support';
import { buildLogger } from '../../log-factory';
import { removeFiles } from '../../file-helper';
import NpmDir from '../../npm/npm-dir';
import _ from 'lodash';
import Entry from './entry';
import resolve from 'resolve';
import { build as buildWebpack } from '../../code-gen/webpack-builder';
import { configToJsString, writeConfig } from '../../code-gen/webpack-write-config';
import { clientDependencies } from './defaults';
const logger = buildLogger();

const defaultSupport = [
  path.join(__dirname, '../../framework-support/frameworks/react'),
  path.join(__dirname, '../../framework-support/frameworks/less')
];


class EntryElements {
  constructor(elements) {
    this.elements = elements;
  }

  get keys() {
    let toKey = (p) => _.isString(p) ? p : p.key;
    return _.map(this.elements, toKey);
  }

}

const pieController = {
  key: 'pie-controller',
  initSrc: `
        import Controller from 'pie-controller';
        window.pie = window.pie || {};
        window.pie.Controller = Controller;`
};

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
      root: path.resolve(path.join(root, 'node_modules')),
    },
    resolve: {
      root: path.resolve(path.join(root, 'node_modules')),
      extensions: ['', '.js', '.jsx']
    }
  };
};


export class BuildOpts {
  constructor(bundleName, pieBranch) {
    this.bundleName = bundleName;
    this.pieBranch = pieBranch;
  }

  static build(args) {
    args = args || {};
    return new BuildOpts(
      args.bundleName || 'pie.js',
      args.pieBranch || 'develop');
  }
}

export class ClientBuildable {
  constructor(config, support, opts) {
    this.config = config;
    this.opts = opts;
    this.ENTRY_JS = 'entry.js';
    logger.debug('[constructor], support:', support);
    this.frameworkSupport = FrameworkSupport.bootstrap(support.concat(defaultSupport));
    this.npmDir = new NpmDir(this.dir);
    this.entry = new Entry(this.dir);
  }

  get dir() {
    return this.config.dir;
  }

  pack(clean) {
    return this._install(clean)
      .then(() => this.writeEntryJs())
      .then(() => this.webpackConfig())
      .then((config) => this.bundle(config));
  }

  writeEntryJs() {
    return this.entry.write(this._entryElements.elements);
  }

  get _entryElements() {
    let names = _.map(this.config.pies, (nv) => nv.name);
    return new EntryElements([pieController, 'pie-player', 'pie-control-panel'].concat(names));
  }

  clean() {
    logger.debug('[clean]...');
    let files = [this.opts.bundleName, this.opts.bundleName + '.map', this.ENTRY_JS];
    return this.npmDir.clean()
      .then(() => this.entry.clean())
      .then(() => removeFiles(this.dir, files));
  }

  webpackConfig() {
    let config = _.extend({
      context: this.dir,
      entry: path.join(this.dir, this.entry.name),
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
      writeConfig(path.join(this.dir, 'webpack.config.js'), config);
    }

    return buildWebpack(config)
      .then(({ stats, duration }) => {
        return config.output.filename;
      });
  }

  /**
   * Initialise _supportConfig for use in later steps;
   */
  _buildFrameworkConfig() {

    let mergeDependencies = (acc, deps) => {
      return _.reduce(deps, (acc, value, key) => {
        if (acc[key]) {
          acc[key].push(value);
        }
        else {
          acc[key] = [value];
        }
        return acc;
      }, acc);
    };

    //Note: we can only read piePackages after an npm install.
    let allPackages = _.concat(
      this.config.piePackages,
      this.config.readPackages(this._entryElements.keys));

    let merged = _(allPackages).map('dependencies').reduce(mergeDependencies, {});

    logger.silly('merged dependencies that need support: ', JSON.stringify(merged));
    this._supportConfig = this.frameworkSupport.buildConfigFromPieDependencies(merged);
    return Promise.resolve();
  }

  _install(clean = false) {
    let dependencies = _.extend({}, clientDependencies(this.opts.pieBranch), this.config.npmDependencies);
    let step = clean ? this.clean() : Promise.resolve();
    return step
      .then(() => this.npmDir.install(dependencies))
      .then(() => this._buildFrameworkConfig())
      .then(() => this._installFrameworkDependencies());
  }

  _installFrameworkDependencies() {

    if (!this._supportConfig) {
      return Promise.reject(new Error('no support config - has it been initialised?'));
    }

    logger.silly('supportConfig: ', JSON.stringify(this._supportConfig.npmDependencies));

    return this.npmDir.installMoreDependencies(this._supportConfig.npmDependencies, { save: true });
  }
}