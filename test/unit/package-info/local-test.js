import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import * as _ from 'lodash';

const ROOT = '../../../lib';

let stat = (isFile) => {
  isFile = isFile === undefined ? false : true;

  return {
    isFile: stub().returns(isFile),
  }
}

describe('local', () => {
  let Local, local, deps;

  beforeEach(() => {
    deps = {
      'fs-extra': {
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
        statSync.returns(stat(true));
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

  describe('view', () => {

    let fsExtra, result;

    beforeEach(() => {
      fsExtra = deps['fs-extra'];
    });

    describe('with missing package.json', () => {

      beforeEach(() => {
        local.match = stub().returns(false);
        fsExtra.readJson.yields(null, { dependencies: { a: '1.0.0' } })
        return local.view({ key: 'any', value: '../..' }, 'dependencies')
          .then(r => result = r);
      });

      it('does not call readJson', () => {
        assert.notCalled(fsExtra.readJson);
      });

      it('returns undefined', () => {
        expect(result).to.be.undefined;
      });
    });

    describe('with found package.json', () => {

      beforeEach(() => {
        fsExtra.statSync.returns(stat(true));
        fsExtra.readJson.yields(null, { dependencies: { a: '1.0.0' } })
        return local.view({ key: 'any', value: '../..' }, 'dependencies')
          .then(r => result = r);
      });

      it('calls readJson', () => {
        assert.calledWith(fsExtra.readJson, local.pkgPath({ value: '../..' }))
      });

      it('returns the data', () => {
        expect(result).to.eql({ a: '1.0.0' });
      });
    });

  });
});