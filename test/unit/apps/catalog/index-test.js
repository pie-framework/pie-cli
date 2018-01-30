import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import { path as p } from '../../../../lib/string-utils';
import proxyquire from 'proxyquire';
import { setDefaultLevel, buildLogger } from 'log-factory';

const logger = buildLogger();
setDefaultLevel('silly');

describe('catalog', () => {

  let mod, deps, catalog, NAMES, support;

  beforeEach(() => {

    deps = {
      './info-builder': {
        gitInfo: stub().returns(Promise.resolve({})),
        npmInfo: stub().returns(Promise.resolve({})),
        gitTag: stub().returns(Promise.resolve('1.0.0')),
        gitHash: stub().returns(Promise.resolve('HASH'))
      },
      '../base': {
        BaseApp: stub()
      },
      'fs-extra': {
        existsSync: stub().returns(true),
        writeFileSync: stub(),
        readJsonSync: stub(),
        readFileSync: stub().returns('file')
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
      catalog.installer.install = stub().returns(Promise.resolve({
        dirs: {
          root: 'root',
          configure: 'configure',
          controllers: 'controllers'
        }, buildInfo: []
      }));
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
      assert.calledWith(deps['fs-extra'].writeFileSync, p`root/catalog.entry.js`);

    });

    it('calls buildWebpack', () => {
      assert.calledWith(deps['../../code-gen'].buildWebpack, match.object, 'catalog.webpack.config.js');
    });

    xit('assert webpack config object', () => { });

    it('returns mappings', () => {
      expect(result).to.eql([]);
    });

  });

  describe('createArchive', () => {
    let addExtras, archive;
    let init = (exists) => {

      deps['fs-extra'].existsSync.returns(exists);
      deps['fs-extra'].readJsonSync.returns({});

      addExtras = stub();
      mod.addExtras = stub().returns(addExtras);

      deps['../create-archive'].createArchive = stub().returns(Promise.resolve({}));

      return catalog.createArchive([{
        element: 'my-pie',
        configure: {
          tag: 'my-pie-configure',
          moduleId: 'my-pie-configure'
        }
      }]);
    }

    beforeEach(() => {
      archive = {
        file: stub(),
        directory: stub(),
        append: stub()
      }
      return init(true);
    });

    it('calls createArchvive', () => {
      assert.calledWith(deps['../create-archive'].createArchive, match(/.*pie-item.tar.gz$/), 'dir', [], match.func);
    });

    describe('when schemas does not exist', () => {
      beforeEach(() => init(false));

      it('does not call archive.directory for package.json', () => {
        assert.notCalled(archive.directory)
      });
    });
  });

  describe('addExtras', () => {

    it('works', () => {
      const fn = mod.addExtras({}, 'markup', { externals: {} }, [], { version: '1.0.0' }, {}, '', {}, {}, []);
      const archive = { append: stub() }
      fn(archive);
      assert.calledWith(archive.append, match.string, { name: 'pie-catalog-data.json' });
    });
  });
});

