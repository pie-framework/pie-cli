import _ from 'lodash';
import {fileLogger} from '../log-factory';

/**
 * TODO: default to PieLabs/$key if not found in the lookup.
 * TODO: The config doesn't handle version conflicts atm.
 */
export default class Config{
  constructor(raw, lookup){
    this._raw = raw;
    this._lookup = lookup || {};
    this._logger = fileLogger(__filename);
  }

  /**
   * @return a npm style map with `key: location`.
   * If `lookup` doesn't contain a path to `key` we default to 'PieLabs/$key'
   */
  get npmDependencies() {
    let toUniqueNames = (acc, p) => {
      let existing = _.find(acc, {name: p.name});
      if(existing){
        existing.versions = _(existing.versions).concat(p.version).uniq(); 
      } else {
        acc.push({name: p.name, versions: [p.version]});
      }
      return acc;
    }

    let addLookup = (un) => {
      un.lookup = this._lookup[un.name];
      return un;
    }

    let addKeyAndLookup = (acc, un) => {
      acc[un.name] = this._lookup[un.name];
      return acc;
    } 

    this._logger.debug(JSON.stringify(this._raw));
    this._logger.debug(JSON.stringify(_.map(this._raw.pies, 'pie')));

    let uniqNameAndVersions = _(this._raw.pies)
      .map('pie')
      .reduce(toUniqueNames, [])
      .map(addLookup);

      this._logger.debug('uniqNameAndVersions', uniqNameAndVersions);
      return _.reduce(uniqNameAndVersions, addKeyAndLookup, {});
  } 

  get pie(){
    return new Pie(this._raw.pie || {});
  }
}