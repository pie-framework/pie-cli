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

    let npmDependencies = _.extend({}, DEFAULT_DEPENDENCIES(opts.pieBranch), this._question.clientDependencies);

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
        logger.silly('supportConfig: ', JSON.stringify(supportConfig.clientDependencies));
        if (!supportConfig) {
          return Promise.reject(new Error('no support config'));
        }

        return this._npmDir.installMoreDependencies(supportConfig.clientDependencies, { save: true })
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
