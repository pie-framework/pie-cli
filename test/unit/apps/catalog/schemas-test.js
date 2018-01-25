import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';


describe('schemas', () => {

  let mod, deps;

  beforeEach(() => {

    const mkStub = (dir, f) => {
      return {
        isDirectory: stub().returns(dir),
        isFile: stub().returns(f)
      }
    };

    const statSync = stub();
    statSync.withArgs('path/file.json').returns(mkStub(false, true));
    statSync.withArgs('path/dir').returns(mkStub(true, false));
    statSync.withArgs('path').returns(mkStub(true, false));

    deps = {
      'fs-extra': {
        statSync,
        readJsonSync: stub().returns({}),
        readdirSync: stub().returns(['file.json', 'dir']),
        existsSync: stub().returns(true)
      }
    }

    mod = proxyquire('../../../../lib/apps/catalog/schemas', deps);
  });

  describe('buildSchemas', () => {


    it('builds', () => {
      expect(mod.buildSchemas('path')).to.eql([{ name: 'file.json', json: {} }]);
    })
  });
});