import _ from 'lodash';

export default class Config{
  constructor(raw, lookup){
    this._raw = raw;
    this._lookup = lookup;
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

    let addKeyAndLookup = () => {} 

    let uniqNameAndVersions = _(this._raw.pies)
      .pick('pie')
      .reduce(toUniqueNames, [])
      .map(addLookup);

    let breakingVersions = _.filter(uniqNameAndVersions, (un) => {
      un.versions
    });

    if(breakingVersions.length > 0){
      throw new Error('Breaking changes found!')
    } else {
      return _.reduce(uniqNameAndVersions, addKeyAndLookup, {});
    }
  } 
}