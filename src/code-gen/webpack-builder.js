import webpack from 'webpack';
import { buildLogger } from '../log-factory';
import _ from 'lodash';
import { basename } from 'path';
import querystring from 'querystring';

const logger = buildLogger();


class LoaderName {
  constructor(n) {
    this.name = n;
  }
  get normalized() {
    let base = basename(this.name, '.js');
    if (_.endsWith(base, '-loader')) {
      return base;
    } else {
      return `${base}-loader`;
    }
  }
}

class Loader {
  constructor(obj) {
    this._raw = obj;
    this._names = new LoaderNames(obj.loader);
  }

  get normalizedName() {
    return this._names.normalizedStringName;
  }
}

class LoaderNames {

  constructor(names) {
    this._raw = names;
    let [base, query] = names.split('?');
    this._query = querystring.parse(query);
    this._names = _.map(base.split('!'), n => new LoaderName(n))
  }

  /**
   * [l-loader,x-loader, ...]
   */
  get normalizedNames() {
    return _.map(this._names, n => n.normalized);
  }

  get normalizedStringName() {
    return this.normalizedNames.join('!');
  }

  /**
   * {a: 'A', b: 'b'}
   */
  get query() {
    return this._query;
  }
}

function normalizeLoaderName(name) {
  let base = basename(name, '.js');
  if (_.endsWith(base, '-loader')) {
    return base;
  } else {
    return `${base}-loader`;
  }
}

function normalizeLoaderNames(names) {
  let split = names.split('!');
  return _.map(split, normalizeLoaderName).join('!')
}

function removeDuplicateLoaders(config) {

  logger.silly('[removeDuplicateLoaders] config: ', JSON.stringify(config));

  let c = _.cloneDeep(config);

  c.module = c.module || { loaders: [] }

  let loaderGroups = _.reduce(c.module.loaders, (acc, loader) => {

    logger.silly('[removeDuplicateLoaders] acc: ', acc, ' loader:', loader);

    let wrapped = new Loader(loader);
    let name = wrapped.normalizedName;

    /** 
     * in webpack for a loader called 'less' the following are equal: 
     * less == less-loader
     */

    if (acc[name]) {
      acc[name].push(wrapped);
    } else {
      acc[name] = [wrapped];
    }
    return acc;
  }, {});

  let mergedGroups = _.reduce(loaderGroups, (acc, loaderArray, key) => {

    if (loaderArray.length === 0) {
      throw new Error(`loader array for ${key} is empty - this should never happen`);
    }

    let loader = _.reduce(_.tail(loaderArray), (acc, wrapped) => {
      return acc.merge(wrapped);
    }, _.head(loaderArray));

    acc[key] = loader;
    // let head = _.head(loaderArray);
    // let rest = _.tail(loaderArray);

    // acc.loaders.push(head);

    // if (rest.length > 0) {
    //   acc.duplicates[key] = acc.duplicates[key] || {}
    //   acc.duplicates[key] = rest;
    // }

    return acc;

  }, {});

  logger.silly('[removeDuplicateLoaders] updatedConfig: ', c);

  c.module.loaders = _(mergedGroups).values().map('webpackObject').value();
  return c;
}

export function normalizeConfig(config) {
  return removeDuplicateLoaders(config);
}

export function build(config) {

  let normalized = normalizeConfig(config).normalized;

  return new Promise((resolve, reject) => {
    webpack(normalized, (err, stats) => {
      if (err) {
        logger.error(err.message);
        reject(err);
      }
      else if (stats.hasErrors()) {
        _.forEach(stats.compilation.errors, (e) => logger.error(e));
        reject(new Error('Webpack build errors - see the logs'));
      }
      else {
        logger.info(`webpack compile done. duration (ms): ${stats.endTime - stats.startTime}`);
        let duration = stats.endTime - stats.startTime;
        resolve({ stats: stats, duration: duration });
      }
    });
  });
}