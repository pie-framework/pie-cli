import NpmDir from '../npm/npm-dir';
import * as elementBundle from '../code-gen/element-bundle';
import * as controllerMap from '../code-gen/controller-map';
import * as markupExample from '../code-gen/markup-example';
import _ from 'lodash'
import { buildLogger } from '../log-factory';

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

    let npmDependencies = _.extend({}, DEFAULT_DEPENDENCIES, this._question.npmDependencies);

    logger.debug('npm dependencies: ', JSON.stringify(npmDependencies));

    let buildElementBundle = (supportConfig) => {

      //TODO: This has been externalised - will prob change anyway w/ new controller build.
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


    // 1. create npm dir
    /*

    - client-dir 
        index.html
        config.json
        package.json { comp: '../..'}
        node_modules/
        controller-dir/
          package.json { comp-controller: '../../controller'}
    */


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
      .then(() => controllerMap.build(this._question.dir, opts.configFile, opts.controllersJs, this._question.npmDependencies))
      .then(() => {
        if (!opts.keepBuildAssets) {
          return this._npmDir.clean()
            .then(() => elementBundle.cleanBuildAssets(this._question.dir));
        } else {
          return Promise.resolve();
        }
      })
      .then(() => {
        if (opts.buildExample) {
          return markupExample.build(this._question.dir, opts.markupFile, opts.exampleFile, opts.configFile);
        } else {
          return Promise.resolve('');
        }
      })
      .then(() => logger.debug('packing completed'));
  }
}

export const DEFAULT_DEPENDENCIES = {
  'babel-core': '^6.16.0',
  'webpack': '2.1.0-beta.21',
  'babel-core': '^6.17.0',
  'babel-loader': '^6.2.5',
  'babel-preset-es2015': '^6.16.0',
  'pie-player': 'PieLabs/pie-player',
  'pie-controller': 'PieLabs/pie-controller',
  'pie-control-panel': 'PieLabs/pie-control-panel',
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
  fullInstall: false
}