import {expect} from 'chai';
import * as path from 'path';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

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