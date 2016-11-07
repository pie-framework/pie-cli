import proxyquire from 'proxyquire';
import sinon from 'sinon';
import { expect } from 'chai';

describe('framework-support', () => {


  describe('bootstrap', () => {

    let FrameworkSupport, support, fsExtra, resolve, mockRequire, babelRegister;

    beforeEach(() => {

      mockRequire = sinon.stub().returns({
        support: sinon.stub().returns({
          npmDependencies: {},
          webpackLoaders: (/*resolve*/) => {
            return []
          }
        })
      });

      fsExtra = {
        readdirSync: sinon.stub().returns(['support.js']),
        lstatSync: sinon.stub().returns({ isFile: sinon.stub().returns(true) })
      };

      resolve = {
        sync: sinon.spy(function (p) { return p; })
      }

      babelRegister = sinon.stub();

      FrameworkSupport = proxyquire('../../../src/framework-support', {
        'fs-extra': fsExtra,
        resolve: resolve,
        'babel-register': babelRegister
      }).default;
    });

    it('calls babelRegister w/ plugins', () => {
      sinon.assert.calledWith(babelRegister, {
        plugins: ['babel-plugin-transform-es2015-modules-commonjs']
      });
    });

    it('reads in modules from the dir', () => {
      support = FrameworkSupport.bootstrap(['path/to/support.js'], mockRequire);
      expect(support.frameworks.length).to.eql(1);
    });

    it('reads in 2 modules from the dir', () => {
      support = FrameworkSupport.bootstrap([
        'path/to/support.js',
        'some/other/path.js'], mockRequire);
      expect(support.frameworks.length).to.eql(2);
    });

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

    describe('with default export', () => {
      beforeEach(() => {
        frameworkSupport = new FrameworkSupport([
          {
            default: {
              npmDependencies: {
                'babel-preset-react': '1.0'
              },
              webpackLoaders: () => {
                return { test: 'test' };
              }
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