import crypto from 'crypto';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('npm', () => {

  let helper, stat;

  before(() => {
    stat = {
      isDirectory: sinon.stub().returns(true)
    };
    helper = proxyquire('../../../lib/npm', {
      'fs-extra': {
        lstatSync: sinon.stub().returns(stat)
      },
      path: {
        resolve: sinon.stub().returns('resolved')
      }
    });
  });

  describe('pathIsDir', () => {

    it('returns true if path is dir', () => {
      expect(helper.pathIsDir('root', 'dir')).to.eql(true);
    });

    it('returns false if path is dir', () => {
      stat.isDirectory = sinon.stub().returns(false);
      expect(helper.pathIsDir('root', 'dir')).to.eql(false);
    });
  });
});