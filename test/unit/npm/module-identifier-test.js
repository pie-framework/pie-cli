import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('module-identifier', () => {

  let mod, deps;

  beforeEach(() => {

    deps = {
      path: {
        resolve: spy(function (...args) {
          return args.join('');
        })
      }
    }
    mod = proxyquire('../../../lib/npm/module-identifier', deps);
  });


  describe('normalizePath', () => {
    it('normalizes windows paths', () => {
      expect(mod.normalizePath(`C:\\\\Dir\\Path`)).to.eql('C:/Dir/Path');
    });

    it('normalizes paths with file:', () => {
      expect(mod.normalizePath('file:/apple')).to.eql('/apple');
    });
  });

  describe('moduleIdForPath', () => {

    let moduleIdForPath;
    beforeEach(() => {
      moduleIdForPath = mod.moduleIdForPath;
    });

    it('returns id for github shortcut', () => {
      const pkg = {
        dependencies: {
          foo: 'github:foo/bar'
        }
      }
      expect(moduleIdForPath('dir', pkg, 'foo/bar')).to.eql('foo')
    });

    it('returns normalizes the case', () => {
      const pkg = {
        dependencies: {
          foo: 'github:foo/bar'
        }
      }
      expect(moduleIdForPath('dir', pkg, 'Foo/Bar')).to.eql('foo')
    });

    it('handles k@v', () => {

      const pkg = {
        dependencies: {
          foo: '*'
        }
      }

      expect(moduleIdForPath('dir', pkg, 'foo@latest')).to.eql('foo')
    });

    it('handles file paths', () => {

      deps['path'].resolve = stub().returns('/var/dev/path/to/local/pkg');

      const pkg = {
        dependencies: {
          foo: 'file:///var/dev/path/to/local/pkg'
        }
      }

      expect(moduleIdForPath('dir', pkg, '../path/to/local/pkg')).to.eql('foo')
    });

    it('handles file paths with /private', () => {

      deps['path'].resolve = stub().returns('/var/dev/path/to/local/pkg');

      const pkg = {
        dependencies: {
          foo: 'file:///private/var/dev/path/to/local/pkg'
        }
      }

      expect(moduleIdForPath('dir', pkg, '../path/to/local/pkg')).to.eql('foo')
    });
  });

  describe('matchInstallDataToRequest', () => {

    let match;

    beforeEach(() => {
      match = mod.matchInstallDataToRequest;
    });

    let assert = (value, data) => {
      it(`matches ${value} to: ${JSON.stringify(data)}`, () => {
        const out = match(value, { moduleId: data });
        expect(out.moduleId).to.eql('moduleId');
      });
    }

    let file = (p) => ({ from: p, resolved: `file:${p}` });

    let github = (p) => ({ from: p, resolved: `git://github.com/:${p}.git` });

    let npm = (p, version) => ({ from: p, version });

    let git = (p) => ({ from: p, resolved: p });

    assert('../../path/to/pkg', file('../../path/to/pkg'));
    assert('file:../../path/to/pkg', file('../../path/to/pkg'));
    assert('org/pkg', github('org/pkg'));
    assert('github:org/pkg', github('org/pkg'));
    assert('github:org/pkg#branch', github('org/pkg#branch'));
    assert('pkg@~1.0.0', npm('pkg@>=1.0.0 <1.1.0', '1.0.9'));
    assert('pkg@1.0.0', npm('pkg@1.0.0', '1.0.0'));
    assert('pkg@latest', npm('pkg@latest', '3.0.0'));
    assert('pkg', npm('pkg@latest', '3.0.0'));
    assert('git+ssh://git@github.com/org/pkg', git('git+ssh://git@github.com/org/pkg.git'));
    assert('git+ssh://git@github.com/org/pkg.git', git('git+ssh://git@github.com/org/pkg.git'));
    assert('git+https://git@github.com/org/pkg', git('git+https://git@github.com/org/pkg.git'));
    assert('git+https://git@github.com/org/pkg.git', git('git+https://git@github.com/org/pkg.git'));
  });

  describe('normalizeValue', () => {

    let normalizeValue;
    beforeEach(() => {
      normalizeValue = mod.normalizeValue;
    });

    let _assert = (only, input, expected) => {
      let fn = only ? it.only : it;
      fn(`normalizes: ${input} to ${JSON.stringify(expected)}`, () => {
        expect(normalizeValue(input)).to.eql(expected);
      });
    }

    let assert = _assert.bind(null, false);
    assert.only = _assert.bind(null, true);

    assert('a', { name: 'a', semver: 'latest' });
    assert('a@latest', { name: 'a', semver: 'latest' });
    assert('a@~1.2.3', { name: 'a', semver: '~1.2.3' });
    assert('a@1.2.3', { name: 'a', semver: '1.2.3' });
    assert('@scope/a', { name: '@scope/a', semver: 'latest' });
    assert('@scope/a@latest', { name: '@scope/a', semver: 'latest' });
    assert('@scope/a@~1.2.3', { name: '@scope/a', semver: '~1.2.3' });
    assert('@scope/a@1.2.3', { name: '@scope/a', semver: '1.2.3' });
  });
});