import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import * as _ from 'lodash';

export const ROOT = '../../../../lib';

/**
 * Some shared stubs..
 */
export function stubs(path, deps) {

  path = _.startsWith(ROOT) ? path : `${ROOT}/${path}`;

  let npmDir = {
    install: stub().returns(Promise.resolve())
  };

  let defaults = {
    './base-config': {
      default: stub().returns({ module: {} })
    },
    'fs-extra': {
      writeFileSync: stub(),
      ensureDirSync: stub()
    },
    '../../code-gen/webpack-builder': {
      build: stub().returns({ duration: 1000 })
    },
    '../../code-gen/webpack-write-config': {
      writeConfig: stub()
    },
    '../../npm/npm-dir': {
      instance: npmDir,
      default: stub().returns(npmDir)
    }
  }

  deps = _.extend(defaults, deps);
  let mod = proxyquire(path, deps);
  mod._deps = deps;
  mod.deps = (key) => {
    let keys = _.keys(mod._deps);
    let foundKey = _.find(keys, k => _.includes(k, key));
    return mod._deps[foundKey];
  }

  mod.instances = {
    npmDir: npmDir
  }
  return mod;
}

export class Sandbox {
  constructor() {
    this.module = {
      exports: {}
    }
    this.require = stub().returns({});
  }
  get exports() {
    return this.module.exports;
  }
}
