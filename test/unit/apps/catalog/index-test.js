import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('catalog', () => {

  let mod, deps, catalog, NAMES, support;

  beforeEach(() => {

    deps = {
      '../base': {
        BaseApp: stub()
      },
      'fs-extra': {
        existsSync: stub().returns(true),
        writeFileSync: stub()
      },
      '../create-archive': {
        createArchive: stub().returns(Promise.resolve('archive.tar.gz')),
        archiveIgnores: stub().returns([])
      },
      '../../code-gen': {
        buildWebpack: stub().returns(Promise.resolve({}))
      },
      'bluebird': {
        promisify: spy(function (fn) {
          return fn;
        })
      }
    }

    mod = proxyquire('../../../../lib/apps/catalog', deps);

    support = {
      externals: {
        js: ['external.js'],
        css: ['external.css']
      }
    }

    catalog = new mod.default({
      configuration: {
        app: {
          dependencies: {}
        }
      }
    }, 'pieRoot', {
        dir: 'dir',
        declarations: []
      },
      support,
      {
        build: {
          entryFile: '.all-in-one.entry.js'
        },
        out: {
          archive: 'pie-item.tar.gz',
          completeItemTag: {
            path: 'pie-catalog-item.js'
          }
        }
      });

    NAMES = mod.default.NAMES;

  });

  describe('build', () => {
    let result;
    beforeEach(() => {
      catalog.installer.install = stub().returns(Promise.resolve({ controllers: [], configure: [] }));
      catalog.support = {
        rules: []
      }

      return catalog.build({})
        .then((r) => result = r);
    });

    it('calls install', () => {
      assert.called(catalog.installer.install);
    });

    it('calls writeFileSync', () => {
      assert.calledWith(deps['fs-extra'].writeFileSync, 'dir/.pie/catalog.entry.js');
    });

    it('calls buildWebpack', () => {
      assert.calledWith(deps['../../code-gen'].buildWebpack, match.object, 'catalog.webpack.config.js');
    });

    xit('assert webpack config object', () => { });

    it('returns mappings', () => {
      expect(result).to.eql({ controllers: [], configure: [] });
    });

  });

  describe('createArchive', () => {
    let addExtras, archive;
    let init = (exists, done) => {
      archive = {
        file: stub(),
        directory: stub(),
        append: stub()
      }
      deps['fs-extra'].existsSync.returns(exists);
      deps['../create-archive'].createArchive = spy(
        function (name, dir, ignores, ae) {
          addExtras = ae;
          return Promise.resolve(name);
        });
      catalog.createArchive({
        controllers: [], configure: [{
          pie: 'my-pie',
          target: 'my-pie-configure'
        }]
      });
      addExtras(archive);
      done();

    }

    beforeEach((done) => {
      init(true, done);
    });

    it('calls createArchvive', () => {
      assert.calledWith(deps['../create-archive'].createArchive, match(/.*pie-item.tar.gz$/), 'dir', [], match.func);
    });

    it('adds extras in addExtras', () => {
      assert.calledWith(archive.file, match(/.*README.md$/), { name: 'pie-pkg/README.md' });
    });

    it('calls archive.file for package.json', () => {
      assert.calledWith(archive.file, match(/.*package.json$/), { name: 'pie-pkg/package.json' });
    });

    it('calls archive.directory for package.json', () => {
      assert.calledWith(archive.directory, match(/.*docs\/schemas$/), 'schemas');
    });

    it('calls archive.append for externals.json', () => {
      assert.calledWith(archive.append, JSON.stringify(support.externals), { name: 'pie-pkg/externals.json' });
    });

    it('calls archive.append for configure-map.json', () => {
      assert.calledWith(archive.append, JSON.stringify({ 'my-pie': 'my-pie-configure' }), { name: 'pie-pkg/configure-map.json' });
    });

    describe('when schemas does not exist', () => {
      beforeEach((done) => {
        init(false, done);
      });

      it('does not call archive.directory for package.json', () => {
        assert.notCalled(archive.directory)
      });
    });

  });
});

