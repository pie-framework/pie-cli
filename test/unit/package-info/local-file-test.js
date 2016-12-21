import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import * as _ from 'lodash';

const ROOT = '../../../lib';

describe('local', () => {
  let LocalFile, localFile, deps;

  beforeEach(() => {
    deps = {
      'fs-extra': {
        existsSync: stub().returns(true),
      }
    };

    LocalFile = proxyquire(`${ROOT}/package-info/local-file`, deps).default;
    localFile = new LocalFile('dir');
  });

  describe('match', () => {

    it('matches a value with an extension and exists', () => {
      expect(localFile.match({ key: 'any', value: '../path.js' })).to.be.true;
    });

    it('does not match if there is no extension', () => {
      expect(localFile.match({ key: 'any', value: '../path' })).to.be.false;
    });

    it('does not match if there is no file', () => {
      deps['fs-extra'].existsSync.returns(false);
      expect(localFile.match({ key: 'any', value: '../path' })).to.be.false;
    });
  });
});
