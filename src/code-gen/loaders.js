import { basename } from 'path';
import querystring from 'querystring';
import _ from 'lodash';

export class Loader {
  constructor(obj) {
    this._raw = obj;
    this._names = new LoaderNames(obj.loader);
  }

  merge(other) {
    if (!(other instanceof Loader)) {
      throw new Error('this is not a loader');
    }

    if (other.normalizedName !== this.normalizedName) {
      throw this.loadersDontMatchError(other);
    }
  }

  loadersDontMatchError(other) {
    return new Error(`only loaders of the same loader type can be merged this: ${this.normalizedName}, other: ${other.normalizedName}`);
  }

  get normalizedName() {
    return this._names.normalized;
  }
}

export class LoaderNames {

  constructor(names) {
    this._raw = names;
    let [base, query] = names.split('?');
    this._query = querystring.parse(query);
    this._names = _.map(base.split('!'), n => new LoaderName(n))
  }

  get normalized() {
    return _.map(this._names, n => n.normalized).join('!');
  }

  /**
   * {a: 'A', b: 'b'}
   */
  get query() {
    return this._query;
  }
}

export class LoaderName {
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


