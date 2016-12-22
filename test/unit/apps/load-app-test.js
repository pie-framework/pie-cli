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
      '../package-info': {
        info: stub()
      },
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
      beforeEach(() => {
        deps['../package-info'].info
          .onFirstCall().returns({ b: '1.0.0' })
          .onSecondCall().returns({ c: '2.0.0' });
      });

      describe('with no legacy', () => {
        beforeEach((done) => {
          load(done);
        });

        it('calls info for 1st dependency', () => {
          assert.calledWith(deps['../package-info'].info, { key: 'a', value: '1.0.0' }, 'dependencies', 'dir')
        });

        it('calls info for 2nd dependency', () => {
          assert.calledWith(deps['../package-info'].info, { key: 'aa', value: '1.0.0' }, 'dependencies', 'dir')
        });

        it('calls legacySupport', () => {
          assert.calledWith(deps['../framework-support'].legacySupport, { b: '1.0.0', c: '2.0.0' });
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