import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('configure', () => {
  let mod, deps, controllers;

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

    mod = proxyquire('../../../lib/install/controllers', deps);

    controllers = new mod.default('.controllers');
  });

  describe('install', () => {
    beforeEach(() => {
      controllers.npm = {
        install: stub().returns(Promise.resolve())
      }
      return controllers.install([{ key: 'pie', value: 'path', controllerDir: 'controller-dir' }], false)
    });

    it('calls npm install', () => {
      assert.calledWith(controllers.npm.install, 'controllers', { 'pie-target': 'controller-dir' }, {}, false);
    });
  });
});
