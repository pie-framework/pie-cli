import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';

export class Base {
  constructor(args, jsonConfig, supportConfig, names) {
    this.args = args;
    this.config = jsonConfig;
    this.support = supportConfig;
    this.names = names;

    this._super = {
      install: stub().returns(Promise.resolve())
    }

    this.install = this._super.install;
  }
  get buildAssets() { return []; }
  get generatedAssets() { return []; }
}

