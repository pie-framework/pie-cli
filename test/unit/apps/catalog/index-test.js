import { assert, stub, match, spy } from 'sinon';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('catalog', () => {

  let mod, deps, catalog, NAMES;

  beforeEach(() => {

    deps = {
      '../base': {
        BaseApp: stub()
      },
      'fs-extra': {
        existsSync: stub().returns(true),
        writeFile: stub()
      },
      '../create-archive': {
        createArchive: stub().returns(Promise.resolve('archive.tar.gz')),
        archiveIgnores: stub().returns([])
      },
      '../../code-gen/webpack-builder': {
        mkConfig: stub().returns({}),
        build: stub().returns(Promise.resolve({}))
      },
      'bluebird': {
        promisify: spy(function (fn) {
          return fn;
        })
      }
    }

    mod = proxyquire('../../../../lib/apps/catalog', deps);

    catalog = new mod.default({
      configuration: {
        app: {
          dependencies: {}
        }
      }
    }, 'pieRoot', {
        dir: 'dir',
        declarations: []
      }, {}, {
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

  describe('install', () => {

    beforeEach(() => {
      catalog.allInOneBuild = {
        install: stub().returns(Promise.resolve())
      }
    });

    it('calls allInOne.install', () => {
      return catalog.install(false)
        .then(() => {
          assert.calledWith(catalog.allInOneBuild.install, {
            dependencies: {},
            devDependencies: {}
          },
            false
          );
        })
    });
  });

  describe('build', () => {
    let result;
    beforeEach(() => {
      catalog.install = stub().returns(Promise.resolve([]));
      catalog.support = {
        rules: []
      }

      return catalog.build({})
        .then((r) => result = r);
    });

    it('calls install', () => {
      assert.called(catalog.install);
    });

    it('calls writeFile', () => {
      assert.calledWith(deps['fs-extra'].writeFile, 'dir/.catalog.entry.js');
    });

    it('calls buildWebpack', () => {
      assert.calledWith(deps['../../code-gen/webpack-builder'].build, match.object, '.catalog.webpack.config.js')
    });

    it('returns the bundle name', () => {
      expect(result).to.eql([NAMES.bundle]);
    })

  });

  describe('createArchive', () => {
    let addExtras, archive;
    let init = (exists, done) => {
      archive = {
        file: stub(),
        directory: stub()
      }
      deps['fs-extra'].existsSync.returns(exists);
      deps['../create-archive'].createArchive = spy(
        function (name, dir, ignores, ae) {
          addExtras = ae;
          return Promise.resolve(name);
        });
      catalog.createArchive();
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

