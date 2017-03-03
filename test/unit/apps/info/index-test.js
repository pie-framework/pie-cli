import { assert, match, spy, stub } from 'sinon';

import { Base } from '../helper';
import { expect } from 'chai';
import path from 'path';
import proxyquire from 'proxyquire';

const ROOT = '../../../../lib';

describe('info app', () => {
  let mod, args, InfoApp, deps, pieRoot, config, supportConfig, names, instance, result;

  beforeEach(() => {
    deps = {
      'http': {
        createServer: stub().returns({})
      },
      'fs-extra': {
        readFileSync: stub().returns(''),
        readJsonSync: stub().returns({
          name: 'name',
          version: 'version',
          repository: {
            url: 'url'
          }
        })
      },
      './schema-loader': {
        default: stub().returns([])
      },
      '../../question/build/all-in-one': {
        default: stub().returns({}),
        ControllersBuild: stub(),
        SupportConfig: stub()
      }
    }

    mod = proxyquire(`${ROOT}/apps/info`, deps);
    InfoApp = mod.default;
    args = {};
    pieRoot = 'pieRoot';
    config = { dir: 'dir' };
    supportConfig = {
      externals: []
    };

    names = {
      build: {
        entryFile: 'entry.js'
      },
      out: {
        completeItemTag: {
          path: './pie-item.js',
          tag: '<pie-item></pie-item>'
        }
      }
    }
    instance = new InfoApp(args, pieRoot, config, supportConfig, names);
  });

  describe('constructor', () => {
    it('constructs', () => {
      expect(instance).not.to.be.undefined;
    });
  });


  describe('install', () => {

    beforeEach(() => instance.install());

    xit('calls allInOneInstall', () => {
      assert.called(instance._super.install);
    });

  });

  // TODO - update tests..
});