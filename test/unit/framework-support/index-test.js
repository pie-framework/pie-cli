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

    describe('get npmDependencies', () => {
      it('handles modules with no npmDependencies', () => {
        let config = new BuildConfig([{}, { npmDependencies: { a: '1.0.0' } }]);
        expect(config.npmDependencies).to.eql({ a: '1.0.0' });
      });

    });

    describe('webpackLoaders()', () => {
      it('handles modules with no webpackLoaders function', () => {
        let config = new BuildConfig([{}, { webpackLoaders: () => [{ test: 't' }] }]);
        expect(config.webpackLoaders()).to.eql([{ test: 't' }]);
      });
    });

    describe('get externals', () => {

      let assertExternals = (modules, expected) => {
        return () => {
          let config = new BuildConfig(modules);
          expect(config.externals).to.eql(expected);
        }
      }

      it('returns externals from one module', assertExternals(
        [{}, { externals: { js: ['a'], css: ['b'] } }],
        { js: ['a'], css: ['b'] }
      ));

      it('returns externals from 2 modules', assertExternals(
        [
          { externals: { js: ['one.js'], css: ['one.css'] } },
          { externals: { js: ['two.js'], css: ['two.css'] } }
        ],
        {
          js: ['one.js', 'two.js'],
          css: ['one.css', 'two.css']
        }
      ));

      it('handles empty arrays for js or css', assertExternals(
        [{ externals: { js: null, css: null } }],
        { js: [], css: [] }
      ));

      it('handles nulls in arrays for js or css', assertExternals(
        [{ externals: { js: [null], css: [null] } }],
        { js: [], css: [] }
      ));

    });

    it('handles modules with no externals', () => {
      let config = new BuildConfig([{}, { externals: { js: ['a'], css: ['b'] } }]);
      expect(config.externals).to.eql({ js: ['a'], css: ['b'] });
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