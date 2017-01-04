import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';

const ROOT = '../../../lib';

describe('loadApp', () => {

  let loadApp, deps, loadSupportConfig;

  let infoBuild = spy(function (args, loadFn) {
    loadSupportConfig = loadFn;
  });

  let defaultBuild = spy(function (args, loadFn) {
    loadSupportConfig = loadFn;
  });

  beforeEach((done) => {
    deps = {
      '../framework-support': {
        legacySupport: stub(),
        react: 'react',
        less: 'less',
        BuildConfig: stub()
      },
      './types': {
        InfoApp: {
          build: infoBuild
        },
        DefaultApp: {
          build: defaultBuild
        }
      }
    }

    loadApp = proxyquire(`${ROOT}/apps/load-app`, deps).default;
    loadApp({})
      .then(() => {
        done();
      })
      .catch(done);
  });

  describe('with default', () => {

    it('calls default build', () => {
      assert.calledWith(defaultBuild, {});
    });

    let config;

    let load = (done) => {
      loadSupportConfig({
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

        it('calls legacySupport', () => {
          assert.calledWith(deps['../framework-support'].legacySupport, { a: '1.0.0', aa: '1.0.0' });
        });

        it('calls new BuildConfig', () => {
          assert.calledWith(deps['../framework-support'].BuildConfig, ['react', 'less']);
        });

      });

      describe('with legacy', () => {

        beforeEach((done) => {
          deps['../framework-support'].legacySupport.returns('legacy');
          load(done);
        });

        it('calls new BuildConfig w/ legacy support', () => {
          assert.calledWith(deps['../framework-support'].BuildConfig, ['react', 'less', 'legacy']);
        });
      });
    });
  });

});