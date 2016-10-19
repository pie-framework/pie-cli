import NpmDir from '../npm/npm-dir';
import * as elementBundle from '../code-gen/element-bundle';
import * as controllerMap from '../code-gen/controller-map';
import * as markupExample from '../code-gen/markup-example';
import _ from 'lodash'
import { buildLogger } from '../log-factory';
import path from 'path';

let logger = buildLogger();

/**
 * A question packer.
 * > packing means building 2 files: pie.js and controllers.js
 * 
 * pie pq --support ./node_modules/pie-vue-support 
 */
export default class Packer {
  constructor(question, frameworkSupport) {
    logger.silly('new Packer');
    this._question = question;
    this._npmDir = new NpmDir(this._question.dir);
    this._frameworkSupport = frameworkSupport;
  }

  clean(opts) {
    logger.info('[clean]', opts);
    opts = _.extend({}, DEFAULTS, opts);
    let root = this._question.dir;
    return this._npmDir.clean()
      .then(() => elementBundle.clean(root, opts.pieJs))
      .then(() => controllerMap.clean(root, opts.controllersJs))
      .then(() => markupExample.clean(root, opts.exampleFile));
  }

  pack(opts) {
    logger.silly('[pack]', opts);

    opts = _.extend({}, DEFAULTS, opts);

    logger.silly('[pack] opts: ', opts);

    let npmDependencies = _.extend({}, DEFAULT_DEPENDENCIES(opts.pieBranch), this._question.npmDependencies);

    logger.debug('npm dependencies: ', JSON.stringify(npmDependencies));

    let buildElementBundle = (supportConfig) => {

      let pieController = {
        key: 'pie-controller',
        initSrc: `
        import Controller from 'pie-controller';
        window.pie = window.pie || {};
        window.pie.Controller = Controller;`
      }

      logger.silly('now use supportModules to prep the webpack config: ', JSON.stringify(supportConfig));
      let libs = _.flatten([pieController, 'pie-player', 'pie-control-panel'].concat(_.map(this._question.pies, 'name')));
      logger.silly('[buildElementBundle] libs: ', libs);
      return elementBundle.build(this._question.dir, libs, opts.pieJs, supportConfig.webpackLoaders.bind(supportConfig))
    };

    return this._npmDir.install(npmDependencies)
      .then(() => {
        let pieDependencies = this._question.piePackageDependencies;
        logger.silly('pieDependencies: ', JSON.stringify(pieDependencies));
        let supportConfig = this._frameworkSupport.buildConfigFromPieDependencies(pieDependencies);
        logger.silly('supportConfig: ', JSON.stringify(supportConfig.npmDependencies));
        if (!supportConfig) {
          return Promise.reject(new Error('no support config'));
        }

        return this._npmDir.installMoreDependencies(supportConfig.npmDependencies, { save: true })
          .then(() => supportConfig);
      })
      .then(buildElementBundle)
      .then(() => controllerMap.build(this._question, { controllersFilename: opts.controllersJs }))
      .then((controllerBuild) => {
        if (opts.buildExample) {
          return markupExample.build(this._question, controllerBuild, path.join(this._question.dir, opts.exampleFile));
        } else {
          return Promise.resolve('');
        }
      })
      .then(() => {
        if (!opts.keepBuildAssets) {
          return this._npmDir.clean()
            .then(() => elementBundle.cleanBuildAssets(this._question.dir));
        } else {
          return Promise.resolve();
        }
      })
      .then(() => logger.debug('packing completed'));
  }
}

export let DEFAULT_DEPENDENCIES = (branch) => {

  branch = branch || 'master';

  let branchSpecific = {
    'pie-controller': `PieLabs/pie-controller#${branch}`,
    'pie-player': `PieLabs/pie-player#${branch}`,
    'pie-control-panel': `PieLabs/pie-control-panel#${branch}`
  }

  return _.extend({
    'babel-core': '^6.17.0',
    'babel-loader': '^6.2.5',
    'style-loader': '^0.13.1',
    'css-loader': '^0.25.0',
    'babel-preset-es2015': '^6.16.0',
    'css-loader': '^0.25.0',
    'style-loader': '^0.13.1',
    'webpack': '2.1.0-beta.21'

  }, branchSpecific);
};

export const DEFAULTS = {
  configFile: 'config.json',
  dependenciesFile: 'dependencies.json',
  markupFile: 'index.html',
  exampleFile: 'example.html',
  buildExample: false,
  clean: false,
  keepBuildAssets: true,
  pieJs: 'pie.js',
  controllersJs: 'controllers.js',
  fullInstall: false,
  pieBranch: 'develop'
}