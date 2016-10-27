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
    return new BuildOpts(args.bundleName || 'pie.js', args.pieBranch || 'develop');
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

    let buildConfig = this.frameworkSupport.buildConfigFromPieDependencies(this.config.piePackageDependencies);
    let frameworkLoaders = buildConfig.webpackLoaders((k) => resolve.sync(k, { basedir: this.dir }));

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

  _defaultDependencies(branch = 'develop') {
    let branchSpecific = {
      'pie-controller': `PieLabs/pie-controller#${branch}`,
      'pie-player': `PieLabs/pie-player#${branch}`,
      'pie-control-panel': `PieLabs/pie-control-panel#${branch}`
    };

    return _.extend({
      'babel-core': '^6.17.0',
      'babel-loader': '^6.2.5',
      'style-loader': '^0.13.1',
      'css-loader': '^0.25.0',
      'webpack': '2.1.0-beta.21'
    }, branchSpecific);
  }

  _install(clean = false) {
    let dependencies = _.extend({}, this._defaultDependencies(this.opts.pieBranch), this.config.npmDependencies);
    let step = clean ? this.clean() : Promise.resolve();
    return step
      .then(() => this.npmDir.install(dependencies))
      .then(() => this._installFrameworkDependencies());
  }

  _installFrameworkDependencies() {
    let pieDependencies = this.config.piePackageDependencies;
    logger.silly('pieDependencies: ', JSON.stringify(pieDependencies));
    let supportConfig = this.frameworkSupport.buildConfigFromPieDependencies(pieDependencies);
    logger.silly('supportConfig: ', JSON.stringify(supportConfig.npmDependencies));
    if (!supportConfig) {
      return Promise.reject(new Error('no support config'));
    }
    return this.npmDir.installMoreDependencies(supportConfig.npmDependencies, { save: true })
      .then(() => supportConfig);
  }
}