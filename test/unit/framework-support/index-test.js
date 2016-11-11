import proxyquire from 'proxyquire';
import { assert, stub } from 'sinon';
import { expect } from 'chai';

describe('framework-support', () => {


  describe('BuildConfig', () => {

    let BuildConfig;
    beforeEach(() => {
      BuildConfig = proxyquire('../../../src/framework-support', {
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

    let FrameworkSupport, supportModule;

    beforeEach(() => {

      let supportModuleResult = {
        npmDependencies: {
          a: '1.0.0'
        },
        webpackLoaders: (/*resolve*/) => {
          return []
        }
      };

      supportModule = {
        loadSupportModules: stub().returns(Promise.resolve([supportModuleResult]))
      }

      FrameworkSupport = proxyquire('../../../src/framework-support', {
        './support-module': supportModule
      }).default;
    });

    let withSupport = (paths, fn) => {
      return done => {
        FrameworkSupport.bootstrap('dir', paths)
          .then(support => {
            fn(support);
            done();
          })
          .catch(done);
      }
    }

    it('reads in modules from the dir', withSupport(['path/to/support.js'], support => {
      expect(support.frameworks.length).to.eql(1);
    }));

    it('calls loadSupportModules with 2 paths', withSupport([
      'path/to/support.js',
      'some/other/path.js'], () => {
        assert.calledWith(supportModule.loadSupportModules, 'dir', ['path/to/support.js', 'some/other/path.js']);
      }));

    it('uses module from support-module', withSupport([], support => {
      let config = support.buildConfigFromPieDependencies({});
      expect(config.npmDependencies).to.eql({ a: '1.0.0' });
    }));
  });

  describe('buildConfigFromPieDependencies', () => {

    let frameworkSupport, FrameworkSupport, supportArray;

    beforeEach(() => {
      FrameworkSupport = require('../../../src/framework-support').default;
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