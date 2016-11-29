import * as _ from 'lodash';
import { buildLogger } from '../log-factory';
import { Loader } from './loaders';

const logger = buildLogger();

let _getDuplicates = (config) => {

  if (!config || !config.module || !config.module.loaders) {
    return new DuplicateLoaders();
  }

  logger.silly('[removeDuplicateLoaders] config: ', JSON.stringify(config));

  let c = _.cloneDeep(config);

  c.module = c.module || { loaders: [] }

  let loaderGroups = _.reduce(c.module.loaders, (acc, loader) => {

    logger.silly('[removeDuplicateLoaders] acc: ', acc, ' loader:', loader);

    let wrapped = new Loader(loader);
    let name = wrapped.normalizedName;
    let test = wrapped.test;
    let uid = `${name}-${test}`;

    if (acc[uid]) {
      acc[uid].push(wrapped);
    } else {
      acc[uid] = [wrapped];
    }
    return acc;
  }, {});

  return _.reduce(loaderGroups, (duplicates, loaderArray: any[], key) => {

    if (loaderArray.length === 0) {
      throw new Error(`loader array for ${key} is empty - this should never happen`);
    }

    if (loaderArray.length > 1) {
      duplicates.add(key, loaderArray);
    }
    return duplicates;

  }, new DuplicateLoaders());
}

export default class DuplicateLoaders {

  private _duplicates = {};
  constructor() { }

  get error() {
    let msg = `The following loaders are duplicated: ${_.keys(this._duplicates).join(', ')}`
    return new Error(msg);
  }

  get present() {
    return !_.isEmpty(this._duplicates);
  }

  static fromConfig(config) {
    return _getDuplicates(config);
  }

  add(key, loaders) {
    if (this._duplicates[key]) {
      this._duplicates[key] = _.concat(this._duplicates[key], loaders);
    } else {
      let newLoaderMap = {};
      newLoaderMap[key] = loaders;
      this._duplicates = _.extend(this._duplicates, newLoaderMap);
    }
    return this;
  }
}
