import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

const ROOT = '../../../lib';

describe('load-app', () => {

  let mod, deps, loadSupportConfig;

  let stubApp = (name) => ({
    default: {
      build: stub().returns({})
    }
  });

  beforeEach(() => {
    deps = {
      '../framework-support': {
        MultiConfig: stub(),
        load: stub().returns(Promise.resolve({
          modules: [],
          rules: []
        }))
      },
      './types': {
      },
      './default': stubApp('default'),
      './info': stubApp('info'),
      './catalog': stubApp('catalog'),
      './item': stubApp('item')
    }

    mod = proxyquire(`${ROOT}/apps/load-app`, deps);
  });

  describe('loadApp', () => {

    beforeEach(() => mod.loadApp({}));

    describe('with default', () => {

      it('calls default build', () => {
        assert.calledWith(deps['./default'].default.build, {});
      });

      let config;

      let load = (done) => {
        mod.loadSupportConfig({
          dir: 'dir',
          dependencies: {
            a: '1.0.0',
            aa: '1.0.0'
          }
        }).then((c) => {
          config = c;
          done();
        }).catch(done);
      };

      describe('loadSupportConfig', () => {

        describe('with no legacy', () => {
          beforeEach((done) => {
            load(done);
          });

          xit('calls legacySupport', () => {
            assert.calledWith(deps['../framework-support'].legacySupport, { a: '1.0.0', aa: '1.0.0' });
          });

          it('calls new MultiConfig', () => {
            assert.calledWith(deps['../framework-support'].MultiConfig, match.object, match.object);
          });

        });

      });
    });
  });

});