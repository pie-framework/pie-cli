import { spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('framework-support', () => {

  let mod, deps;

  beforeEach(() => {
    deps = {
      'fs-extra': {},
      resolve: {},
      './support-module': {}
    };

    mod = proxyquire('../../../lib/framework-support', deps);
  });

  describe('findModuleRoot', () => {

    it('find the module root', () => {
      deps['resolve'].sync = stub().returns('a/b/c/blah/src/index.js');
      expect(mod.findModuleRoot('blah')).to.eql('a/b/c/blah');
    });
  });

  describe('MultiConfig', () => {

    let MultiConfig;

    beforeEach(() => {
      MultiConfig = mod.MultiConfig;
    });

    describe('rules', () => {

      it('flattens rules', () => {
        let config = new MultiConfig({ rules: [{ test: 'a' }] }, { rules: [{ test: 't' }] });
        expect(config.rules).to.eql([{ test: 'a' }, { test: 't' }]);
      });
    });

    describe('get externals', () => {

      let assertExternals = (modules, expected) => {
        return () => {
          let config = new MultiConfig(...modules);
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
      let config = new MultiConfig({}, { externals: { js: ['a'], css: ['b'] } });
      expect(config.externals).to.eql({ js: ['a'], css: ['b'] });
    });
  });

  describe('load', () => {

    let moduleRequire, result, moduleData;

    describe('with no data', () => {
      beforeEach(() => {
        moduleData = {};
        moduleRequire = stub().returns(moduleData);
        return mod.load({}, 'path', moduleRequire)
          .then(r => result = r);
      });

      it('returns empty extensions', () => {
        expect(result.extensions).to.eql([])
      });

      it('returns empty externals', () => {
        expect(result.externals).to.eql({ js: [], css: [] });
      });

      it('returns empty rules array', () => {
        expect(result.rules).to.eql([]);
      });
    });

    describe('with data', () => {
      beforeEach(() => {
        moduleData = {
          extensions: ['.extension'],
          externals: {
            js: ['external.js'],
            css: ['external.css']
          },
          rules: [
            { test: 'test' }
          ]
        };

        moduleRequire = stub().returns(moduleData);

        return mod.load({}, 'path', moduleRequire)
          .then(r => result = r);
      });

      it('returns the extensions', () => {
        expect(result.extensions).to.eql(moduleData.extensions)
      });

      it('returns the externals', () => {
        expect(result.externals).to.eql(moduleData.externals);
      });

      it('returns the rules', () => {
        expect(result.rules).to.eql(moduleData.rules);
      });

    });
  });
});