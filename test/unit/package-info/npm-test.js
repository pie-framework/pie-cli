import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import * as _ from 'lodash';

const ROOT = '../../../lib';

describe('local', () => {
  let npm, localFile, deps, regClient, result;

  beforeEach(() => {

    regClient = {
      get: stub().yields(null, {
        dependencies: {
          a: '1.0.0'
        }
      })
    }

    deps = {
      'fs-extra': {
        existsSync: stub().returns(true),
      },
      'npm-registry-client': stub().returns(regClient)
    };
    npm = proxyquire(`${ROOT}/package-info/npm`, deps).default;
  });

  describe('match', () => {

    it('matches a valid semver', () => {
      expect(npm.match({ key: 'dep', value: '1.0.0' })).to.be.true;
    });

    it('matches *', () => {
      expect(npm.match({ key: 'dep', value: '*' })).to.be.true;
    });

    it('does not match a path', () => {
      expect(npm.match({ key: 'dep', value: 'path/to' })).to.be.false;
    });

  });

  describe('view', () => {

    beforeEach(() => {
      return npm.view({ key: 'dep', value: '1.0.0' }, 'dependencies')
        .then(r => result = r);
    });

    it('calls npm-registry-client.get', () => {
      assert.calledWith(regClient.get,
        `http://registry.npmjs.org/dep/1.0.0`,
        { timeout: 1000 }, match.func);
    });

    it('returns the data', () => {
      expect(result).to.eql({ a: '1.0.0' });
    });
  });
});
