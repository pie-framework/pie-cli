import _ from 'loadsh';
import {buildLogger} from '../log-factory';
import fs from 'fs-extra';
import path from 'path';

const logger = buildLogger();


/**
 * TODO: default to PieLabs/$key if not found in the lookup.
 * TODO: The config doesn't handle version conflicts atm.
 */
// class Config{
//   constructor(raw, lookup){
//     this._raw = raw;
//     this._lookup = lookup || {};
//   }

//   get npmDependencies() {
//     let toUniqueNames = (acc, p) => {
//       let existing = _.find(acc, {name: p.name});
//       if(existing){
//         existing.versions = _(existing.versions).concat(p.version).uniq(); 
//       } else {
//         acc.push({name: p.name, versions: [p.version]});
//       }
//       return acc;
//     }

//     let addLookup = (un) => {
//       un.lookup = this._lookup[un.name];
//       return un;
//     }

//     let addKeyAndLookup = (acc, un) => {
//       acc[un.name] = this._lookup[un.name];
//       return acc;
//     } 

//     logger.debug(JSON.stringify(this._raw));
//     logger.debug(JSON.stringify(_.map(this._raw.pies, 'pie')));

//     let uniqNameAndVersions = _(this._raw.pies)
//       .map('pie')
//       .reduce(toUniqueNames, [])
//       .map(addLookup);

//       logger.debug('uniqNameAndVersions', uniqNameAndVersions);
//       return _.reduce(uniqNameAndVersions, addKeyAndLookup, {});
//   } 
// }


/** 
 * A representation of a pie question directory,
 * which includes a `config.json`, `index.html`, maybe `dependencies.json`
 * And can also include `node_modules`
 */
export default class Question{
  constructor(dir, opts){

    opts = _.extend({}, {
      configFile: 'config.json',
      dependenciesFile: 'dependencies.json',
      markupFile: 'index.html'
    }, opts);

    this._dir = dir;
    
    let readJson = (n) => {
      fs.readJsonSync(path.join(this._dir, n));
    }

    this._opts = opts;
    this._config = readJson(opts.configFile); 
    this._dependencies = readJson(opts.dependenciesFile) || {};
  }

  /**
   * @return Array[{name:, versions: []}]
   */
  get pies() {
    let rawPies = _.map(this._config.pies, 'pie');

    let toUniqueNames = (acc, p) => {
      let existing = _.find(acc, {name: p.name});
      if(existing){
        existing.versions = _(existing.versions).concat(p.version).uniq(); 
      } else {
        acc.push({name: p.name, versions: [p.version]});
      }
      return acc;
    }

    return _.reduce(rawPies, toUniqueNames); 
  }

  get piePackages(){
    return _(this.pies)
    .map('name')
    .map((name) => this.readJson(this._dir, path.join('node_modules', name)));
  }

  /**
   * Return additional dependencies.
   * @return Array[{String|Object{name,npmPkg}}]
   */
  get buildKeys(){
    let pieBuildKeys = _.map(this.piePackages, 'pie.build').flatten();
    logger.debug('[pieBuildDependencies], buildNodes', pieBuildKeys);
    return pieBuildKeys;
  }
}