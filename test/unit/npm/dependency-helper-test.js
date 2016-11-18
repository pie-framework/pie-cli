import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import crypto from 'crypto';

describe('dependency-helper', () => {

  let helper;

  before(() => {
    helper = require('../../../src/npm/dependency-helper');
  });

  describe('isGitUrl', () => {
    it('returns true for git@XXXX', () => {
      expect(helper.isGitUrl('git@github.com:X/y.git')).to.eql(true);
    });
  });

  describe('isSemver', () => {

    let assert = (key, valid) => {
      it(`returns ${valid} for ${key}`, () => {
        expect(helper.isSemver(key)).to.eql(valid);
      });
    }

    assert('1.0.0', true);
    assert('~1.0.0', true);
    assert('apple', false);
  });


  describe('dependenciesToHash', () => {

    it('builds the hash', () => {
      let hash = helper.dependenciesToHash({ a: '1.0.0' });
      expect(hash).to.eql(crypto.createHash('md5').update('a:1.0.0').digest('hex'));
    });

    it('sorts the dependencies before hashing', () => {
      let hash = helper.dependenciesToHash({ z: '1.0.0', y: '2.0.0', a: '1.0.0' });
      expect(hash).to.eql(crypto.createHash('md5').update('a:1.0.0,y:2.0.0,z:1.0.0').digest('hex'));
    });
  });

  describe('pathIsDir', () => {
    let stat;

    before(() => {

      stat = {
        isDirectory: sinon.stub().returns(true)
      };

      helper = proxyquire('../../../src/npm/dependency-helper', {
        'fs-extra': {
          lstatSync: sinon.stub().returns(stat)
        },
        path: {
          resolve: sinon.stub().returns('resolved')
        }
      });
    });

    it('returns true if path is dir', () => {
      expect(helper.pathIsDir('root', 'dir')).to.eql(true);
    });

    it('returns false if path is dir', () => {
      stat.isDirectory = sinon.stub().returns(false);
      expect(helper.pathIsDir('root', 'dir')).to.eql(false);
    });
  });
});