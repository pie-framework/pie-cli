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
      'fs-extra': fsExtra,
      'p.js': {}
    });
  });

  describe('fromPath', () => {

    it('calls readJsonSync if the file ends with .json', () => {
      raw.fromPath('dir', { resolveConfig: stub().returns('resolved.json') });
      assert.calledWith(fsExtra.readJsonSync, 'resolved.json');
    });

    it('calls require if the file ends with .js', () => {
      raw.loadObjectFromJsFile = stub();
      raw.fromPath('dir', { resolveConfig: stub().returns('p.js') });
      assert.calledWith(raw.loadObjectFromJsFile, 'p.js');
    });

  });

});