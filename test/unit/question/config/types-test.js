import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';

describe('types', () => {

  let raw, fsExtra;

  beforeEach(() => {

    fsExtra = {
      readJsonSync: stub().returns({
        elements: {},
        models: []
      })
    };

    raw = proxyquire('../../../../lib/question/config/types', {
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