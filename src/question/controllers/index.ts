import { join, relative, resolve } from 'path';
import * as fs from 'fs-extra';
import { buildLogger } from '../../log-factory';
import { dependenciesToHash } from '../../npm/dependency-helper';
import NpmDir from '../../npm/npm-dir';
import { writeConfig } from '../../code-gen/webpack-write-config';
import { removeFiles } from '../../file-helper';
import { build as buildWebpack } from '../../code-gen/webpack-builder';
import * as _ from 'lodash';
import buildDependencies from '../build-dependencies';
import { BuildInfo } from '../build-info';
import { QuestionConfig } from '../question-config';

let logger = buildLogger();

export class BuildOpts {
  constructor(readonly filename) {
    if (_.isEmpty(this.filename)) {
      throw new Error('filename cannot be empty');
    }
  }
  static build(args) {
    args = args || {};
    return new BuildOpts(args.controllerFilename || 'controllers.js');
  }
}

exports.NPM_DEPENDENCIES = buildDependencies;

const CONTROLLERS_DIR = 'controllers';
export class ControllersBuildable {

  private npmDir;

  constructor(private config: QuestionConfig, private opts) {
    fs.ensureDirSync(this.controllersDir);
    this.npmDir = new NpmDir(this.controllersDir);
    logger.silly('[constructor] this.controllersDir', this.controllersDir);
  }

  private get controllersDir() {
    return join(this.config.dir, CONTROLLERS_DIR);
  }

  private get dependencies() {
    return _.reduce(this.config.pies, (acc, p: any) => {
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

  prepareWebpackConfig() {

    let controllerDependencies = _.mapKeys(this.dependencies, (value, key) => `${key}-controller`);
    let buildDependencies = _.extend({}, controllerDependencies, exports.NPM_DEPENDENCIES);

    fs.ensureDirSync(this.controllersDir);

    return this.npmDir.install(buildDependencies)
      .then(() => this.writeEntryJs(this.dependencies))
      .then(() => this.webpackConfig());
  }

  pack() {
    return this.prepareWebpackConfig()
      .then((config) => this.bundle(config));
  }

  bundle(config) {

    //TODO: Wire this up.
    if (this.opts.writeWebpackConfig) {
      writeConfig(join(this.controllersDir, 'webpack.config.js'), config);
    }

    return buildWebpack(config)
      .then(() => {
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
      let entrySrc = _.map(dependencies, (value, key: string) => {
        return `
         exports['${key}'] = require('${key}-controller');
         exports['${key}'].version = '${value}';
         `;
      });

      fs.writeFileSync(entryPath, entrySrc.join('\n'), 'utf8');
    }
    return Promise.resolve();
  }

  get buildInfo(): BuildInfo {
    return {
      dir: this.config.dir,
      output: [this.opts.filename],
      buildOnly: [CONTROLLERS_DIR]
    }
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