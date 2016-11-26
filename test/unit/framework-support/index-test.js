import proxyquire from 'proxyquire';
import { stub, spy } from 'sinon';
import { expect } from 'chai';

describe('framework-support', () => {


  describe('BuildConfig', () => {

    let BuildConfig;
    beforeEach(() => {
      BuildConfig = proxyquire('../../../lib/framework-support', {
        'fs-extra': {},
        resolve: {},
        './support-module': {}
      }).BuildConfig;
    });

    it('handles modules with no npmDependencies', () => {
      let config = new BuildConfig([{}, { npmDependencies: { a: '1.0.0' } }]);
      expect(config.npmDependencies).to.eql({ a: '1.0.0' });
    });

    it('handles modules with no webpackLoaders function', () => {
      let config = new BuildConfig([{}, { webpackLoaders: () => [{ test: 't' }] }]);
      expect(config.webpackLoaders()).to.eql([{ test: 't' }]);
    });
  });

  describe('bootstrap', () => {

    let FrameworkSupport, support, fsExtra, resolve, supportModule;

    beforeEach(() => {

      let supportModuleResult = {
        npmDependencies: {},
        webpackLoaders: (/*resolve*/) => {
          return []
        }
      };

      fsExtra = {
        readdirSync: stub().returns(['support.js']),
        lstatSync: stub().returns({ isFile: stub().returns(true) })
      };

      supportModule = {
        mkFromPath: stub().returns(supportModuleResult)
      }

      resolve = {
        sync: spy(function (p) { return p; })
      }

      FrameworkSupport = proxyquire('../../../lib/framework-support', {
        'fs-extra': fsExtra,
        resolve: resolve,
        './support-module': supportModule
      }).default;
    });

    it('reads in modules from the dir', () => {
      support = FrameworkSupport.bootstrap(['path/to/support.js']);
      expect(support.frameworks.length).to.eql(1);
    });

    it('reads in 2 modules from the dir', () => {
      support = FrameworkSupport.bootstrap([
        'path/to/support.js',
        'some/other/path.js']);
      expect(support.frameworks.length).to.eql(2);
    });

    it('uses module from support-module', () => {
      supportModule.mkFromPath.returns({
        npmDependencies: {
          a: '1.0.0'
        }
      })

      support = FrameworkSupport.bootstrap(['some/other/path.js']);
      let config = support.buildConfigFromPieDependencies({});
      expect(config.npmDependencies).to.eql({ a: '1.0.0' });
    });
  });

  describe('buildConfigFromPieDependencies', () => {

    let frameworkSupport, FrameworkSupport, supportArray;

    beforeEach(() => {
      FrameworkSupport = require('../../../lib/framework-support').default;
      supportArray = [{
        support: (deps) => {
          if (deps.react) {
            return {
              npmDependencies: {
                'babel-preset-react': '1.0'
              },
              webpackLoaders: (/*resolve*/) => {
                return [
                  { test: 'test' }
                ];
              }
            }
          }
        }
      }];
    });

    let assertNpmDependencies = (expected) => {
      it('returns a build config with npmDependencies', () => {
        let config = frameworkSupport.buildConfigFromPieDependencies(
          {
            react: ['1.2.3']
          }
        );
        expect(config.npmDependencies).to.eql(expected);
      });
    }

    let assertWebpackLoaders = (expected) => {
      it('returns the webpack loaders', () => {
        let config = frameworkSupport.buildConfigFromPieDependencies({
          react: ['1.2.3']
        });
        expect(config.webpackLoaders()).to.eql([expected]);
      });
    }

    describe('with support function', () => {
      beforeEach(() => {
        frameworkSupport = new FrameworkSupport(supportArray);
      });

      assertNpmDependencies({ 'babel-preset-react': '1.0' });
      assertWebpackLoaders({ test: 'test' });
    });

    describe('with default function', () => {
      beforeEach(() => {
        frameworkSupport = new FrameworkSupport([function () {
          return {
            npmDependencies: {
              'babel-preset-react': '1.0'
            },
            webpackLoaders: () => {
              return { test: 'test' };
            }
          }
        }]);
      });

      assertNpmDependencies({ 'babel-preset-react': '1.0' });
      assertWebpackLoaders({ test: 'test' });
    });

    describe('with object', () => {
      beforeEach(() => {
        frameworkSupport = new FrameworkSupport([
          {
            npmDependencies: {
              'babel-preset-react': '1.0'
            },
            webpackLoaders: () => {
              return { test: 'test' };
            }
          }
        ]);
      });

      assertNpmDependencies({ 'babel-preset-react': '1.0' });
      assertWebpackLoaders({ test: 'test' });
    });


    describe('with null', () => {
      let config;
      beforeEach(() => {
        frameworkSupport = new FrameworkSupport([null]);

        config = frameworkSupport.buildConfigFromPieDependencies({
          react: ['1.2.3']
        });
      });

      it('returns an empty npm dependency object', () => {
        expect(config.npmDependencies).to.eql({});
      });

      it('returns an empty webpack loaders array', () => {
        expect(config.webpackLoaders()).to.eql([]);
      });
    });
  });
});