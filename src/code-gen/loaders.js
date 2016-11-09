import { basename } from 'path';
import _ from 'lodash';

export class Loader {
  constructor(obj) {
    this._raw = obj;
    this._names = new LoaderNames(obj.loader);
  }
  get normalizedName() {
    return this._names.normalized;
  }
}

export class LoaderNames {

  constructor(names) {
    this._raw = names;
    let parts = names.split('!');
    this._names = _.map(parts, p => new LoaderName(p));
  }

  get normalized() {
    return _.map(this._names, n => n.normalized).join('!');
  }
}

export class LoaderName {
  constructor(n) {
    this._raw = n;

    let [base, query] = n.split('?');
    this.name = base;
    this.query = query;
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



