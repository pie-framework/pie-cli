import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';

describe('raw', () => {

  let raw, fsExtra;

  beforeEach(() => {

    fsExtra = {
      readJsonSync: stub().returns({
        elements: {},
        models: []
      })
    };

    raw = proxyquire('../../../../lib/question/config/raw', {
      'fs-extra': fsExtra
    });
  });

  describe('fromPath', () => {
    it('calls readJsonSync', () => {
      raw.fromPath('p');
      assert.calledWith(fsExtra.readJsonSync, 'p');
    });
  });

});