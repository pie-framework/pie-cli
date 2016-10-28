import { join, relative, resolve } from 'path';
import fs from 'fs-extra';
import { buildLogger } from '../../log-factory';
import { dependenciesToHash } from '../../npm/dependency-helper';
import NpmDir from '../../npm/npm-dir';
import { writeConfig } from '../../code-gen/webpack-write-config';
import { removeFiles } from '../../file-helper';
import { build as buildWebpack } from '../../code-gen/webpack-builder';
import _ from 'lodash';

let logger = buildLogger();

export class BuildOpts {
  constructor(filename) {
    this.filename = filename;
    if (_.isEmpty(this.filename)) {
      throw new Error('filename cannot be empty');
    }
  }
  static build(args) {
    args = args || {};
    return new BuildOpts(args.controllerFilename || 'controllers.js');
  }
}

exports.NPM_DEPENDENCIES = {
  'babel-core': '^6.17.0',
  'babel-loader': '^6.2.5'
};

export class ControllersBuildable {

  constructor(config, opts) {
    this.config = config;
    this.opts = opts;
    this.controllersDir = join(config.dir, 'controllers');
    fs.ensureDirSync(this.controllersDir);
    this.npmDir = new NpmDir(this.controllersDir);
    logger.silly('[constructro] this.controllersDir', this.controllersDir);
  }

  get dependencies() {
    return _.reduce(this.config.pies, (acc, p) => {
      let pieControllerDir = join(p.installedPath, 'controller');
      logger.silly('[get dependencies] pieControllerDir: ', pieControllerDir);
      if (fs.existsSync(pieControllerDir)) {
        let modulePath = relative(this.controllersDir, pieControllerDir);
        acc[p.name] = modulePath;
      }
      else {
        logger.warn('[build] the following path doesnt exist: ', pieControllerDir);
      }
      return acc;
    }, {});
  }

  get uid() { return dependenciesToHash(this.dependencies); }

  prepareWebpackConfig(clean) {
    let firstStep = clean ? this.clean() : Promise.resolve();

    let buildDependencies = _.extend({}, this.dependencies, exports.NPM_DEPENDENCIES);

    return firstStep
      .then(() => fs.ensureDirSync(this.controllersDir))
      .then(() => this.npmDir.install(buildDependencies))
      .then(() => this.writeEntryJs(this.dependencies))
      .then(() => this.webpackConfig());
  }

  pack(clean) {
    return this.prepareWebpackConfig(clean)
      .then((config) => this.bundle(config));
  }

  bundle(config) {
    writeConfig(join(this.controllersDir, 'webpack.config.js'), config);
    return buildWebpack(config)
      .then(({ stats, duration }) => {
        return {
          dir: config.output.path,
          filename: config.output.filename,
          path: join(config.output.path, config.output.filename),
          library: this.uid
        };
      });
  }

  writeEntryJs(dependencies) {
    let entryPath = join(this.controllersDir, 'entry.js');

    logger.silly('[writeEntryJs] entryPath:', entryPath);

    if (!fs.existsSync(entryPath)) {
      let entrySrc = _.map(dependencies, (value, key) => {
        return `exports['${key}'] = require('${key}-controller');
exports['${key}'].version =  '${value}';`;
      });
      fs.writeFileSync(entryPath, entrySrc.join('\n'), { encoding: 'utf8' });
    }
    return Promise.resolve();
  }

  clean() {
    return this.npmDir.clean()
      .then(() => {
        return removeFiles(this.controllersDir, ['entry.js']);
      })
      .then(() => {
        return removeFiles(this.config.dir, [this.opts.filename]);
      });
  }

  webpackConfig() {

    logger.silly('[webpackConfig], this.opts:', this.opts);

    let config = {
      context: this.controllersDir,
      entry: './entry.js',
      output: {
        path: this.config.dir,
        filename: this.opts.filename,
        library: this.uid,
        libraryTarget: 'umd'
      },
      resolve: {
        root: resolve(join(this.controllersDir, 'node_modules'))
      },
      resolveLoader: {
        root: resolve(join(this.controllersDir, 'node_modules'))
      }
    };
    return Promise.resolve(config);
  }
}