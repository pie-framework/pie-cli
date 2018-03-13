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
      raw.fromPath('dir/resolved.json');
      assert.calledWith(fsExtra.readJsonSync, 'dir/resolved.json');
    });

    it('calls require if the file ends with .js', () => {
      raw.loadObjectFromJsFile = stub();
      raw.fromPath('dir/p.js');
      assert.calledWith(raw.loadObjectFromJsFile, 'dir/p.js');
    });

  });

});