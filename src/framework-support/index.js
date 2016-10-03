import * as helper from './dependency-tree-helper';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import {fileLogger} from '../log-factory';

export default class FrameworkSupport{

  constructor(frameworks){
    this.frameworks = frameworks;
  }

  /**
   * @param pathToObject - convert src at given path to an object
   */
  static bootstrap(dirs, pathToObject){

    let logger = fileLogger(__filename);

    let isJsFile = (dir, f) => {
      return fs.lstatSync(path.join(dir,f)).isFile() && 
        path.extname(f) === '.js'
    }

    let loadModule = (dir, f) => {
      try {
        let supportModule = pathToObject(path.join(dir, f));
        if(_.isFunction(supportModule.support)){
          return supportModule;
        } 
      } catch(e){
        this._logger.error(e);
      }
    };

    logger.silly(`dirs`, dirs);

    let supportModules = _(dirs).map((d) => {
      let files = _.filter(fs.readdirSync(d), (f) => isJsFile(d,f));
      logger.silly('files: ', files);
      let out = _(files).map( (f) => loadModule(d, f)).compact().value();
      logger.silly('out: ', out);
      return out;
    }).flatten().value();

    logger.silly(`supportModules:`, supportModules);

    return new FrameworkSupport(supportModules);
  };


  load(dependencyTree){
    let flat = helper.flattenDependencyTree(dependencyTree);
    let resolve = () => {};
    let support = _.map(this.frameworks, (f) => _(flat).map( d => f.support(d, resolve)).compact()).flatten();
    this._logger.debug(`support: ${support}`);
    return support;
  }
}