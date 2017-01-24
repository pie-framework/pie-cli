import { assert, stub, match } from 'sinon';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('catalog', () => {

  let mod, catalog;

  beforeEach(() => {


    mod = proxyquire('../../../../lib/apps/catalog', {
      '../base': {
        BaseApp: stub()
      }

    });

    catalog = new mod.default({}, 'pieRoot', { dir: 'dir' }, {}, {});
  });

  describe('addExtrasToArchive', () => {
    let archive;

    beforeEach(() => {
      archive = {
        file: stub(),
        directory: stub()
      }

      catalog.addExtrasToArchive(archive);
    });

    it('calls archive.file for README.md', () => {
      assert.calledWith(archive.file, match(/.*README.md$/), { name: 'pie-pkg/README.md' });
    });

    it('calls archive.file for package.json', () => {
      assert.calledWith(archive.file, match(/.*package.json$/), { name: 'pie-pkg/package.json' });
    });

    it('calls archive.directory for package.json', () => {
      assert.calledWith(archive.directory, match(/.*docs\/schemas$/), 'schemas');
    });
  });
});