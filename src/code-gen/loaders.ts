import { basename } from 'path';
import * as _ from 'lodash';

export class Loader {
  private _names: LoaderNames;
  constructor(private _raw) {
    this._names = new LoaderNames(_raw.loader);
  }

  get test() {
    return this._raw.test;
  }

  get normalizedName() {
    return this._names.normalized;
  }
}

export class LoaderNames {

  private _names: LoaderName[];

  constructor(private _raw: string) {
    let parts = _raw.split('!');
    this._names = _.map(parts, p => new LoaderName(p));
  }

  get normalized(): string {
    return _.map(this._names, n => n.normalized).join('!');
  }
}

export class LoaderName {
  readonly name: string;
  readonly query: string;
  constructor(private _raw: string) {
    let [base, query] = _raw.split('?');
    this.name = base;
    this.query = query;
  }

  get normalized(): string {
    let base = basename(this.name, '.js');
    if (_.endsWith(base, '-loader')) {
      return base;
    } else {
      return `${base}-loader`;
    }
  }
}



