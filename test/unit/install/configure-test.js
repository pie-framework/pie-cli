import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('configure', () => {
  let mod, deps, configure;

  beforeEach(() => {

    deps = {
      './common': {
        pieToTarget: stub().returns(Promise.resolve({ pie: 'pie', target: 'pie-target' }))
      },
      '../npm': {
        NpmDir: stub().returns({
          install: stub()
        })
      }
    }

    mod = proxyquire('../../../lib/install/configure', deps);

    configure = new mod.default('.configure');
  });

  describe('install', () => {
    beforeEach(() => {
      configure.npm = {
        install: stub().returns(Promise.resolve())
      }
      return configure.install([{ key: 'pie', value: 'path', configureDir: 'configure-dir' }], false)
    });

    it('calls npm install', () => {
      assert.calledWith(configure.npm.install, 'configure', { 'pie-target': 'configure-dir' }, {}, false);
    });
  });
});
