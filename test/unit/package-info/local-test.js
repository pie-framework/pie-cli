import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import * as _ from 'lodash';

const ROOT = '../../../lib';

let stat = (opts) => {
  opts = _.extend({ isFile: false, isDirectory: false }, opts);
  return {
    isFile: stub().returns(opts.isFile),
    isDirectory: stub().returns(opts.isDirectory)
  }
}

describe('local', () => {
  let Local, local, deps;

  beforeEach(() => {
    deps = {
      'fs-extra': {
        stat: stub().returns(Promise.resolve(stat())),
        statSync: stub().returns(stat()),
        readJson: stub().returns({})
      }
    };

    Local = proxyquire(`${ROOT}/package-info/local`, deps).default;
    local = new Local('dir');
  });

  describe('match', () => {

    describe('with matching local package.json', () => {

      let statSync, result;

      beforeEach(() => {
        statSync = deps['fs-extra'].statSync;
        statSync.returns(stat({ isFile: true }));
        result = local.match({ key: 'any', value: '../..' });
      });

      it('calls statSync', () => {
        assert.calledWith(statSync, '../package.json');
      });

      it('matches', () => {
        expect(result).to.eql(true);
      });
    });

    describe('with missing local package.json', () => {

      let statSync, result;

      beforeEach(() => {
        statSync = deps['fs-extra'].statSync;
        result = local.match({ key: 'any', value: '../..' });
      });

      it('calls statSync', () => {
        assert.calledWith(statSync, '../package.json');
      });

      it('does not match', () => {
        expect(result).to.eql(false);
      });
    });
  });
});