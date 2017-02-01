import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';

describe('create-archive', () => {

  let mod, archiveInstance, deps, mockWritable;

  beforeEach(() => {

    archiveInstance = {
      glob: stub(),
      directory: stub(),
      file: stub(),
      pipe: stub(),
      finalize: stub(),
      on: stub(),
      pointer: stub()
    }

    function MockWritable() {
      this.handlers = {};
      this.on = function (key, handler) {
        this.handlers[key] = handler;
      }
    }

    mockWritable = new MockWritable();

    deps = {
      'archiver': stub().returns(archiveInstance),

      'fs-extra': {
        existsSync: stub().returns(true),
        readFileSync: stub().returns(''),
        createWriteStream: stub().returns(mockWritable)
      }
    };

    mod = proxyquire('../../../lib/apps/create-archive', deps);
  });


  describe('archiveIgnores', () => {
    let ignores;
    beforeEach(() => {

      deps['fs-extra'].readFileSync.returns(`
      .git-file
      package.json`);

      ignores = mod.archiveIgnores('dir');
    });

    let includes = (n) => {
      it(`includes ${n}`, () => {
        expect(ignores.indexOf(n)).not.to.eql(-1);
      });
    };

    includes('node_modules/**');
    includes('controllers/**');
    includes('\.*');
    includes('package.json');
    includes('*.tar.gz');
    includes('.git-file');
  });

  describe('createArchive', () => {

    let addExtras;
    beforeEach((done) => {
      addExtras = stub();
      mod.createArchive('pie.tar.gz', 'dir', [], addExtras);
      mockWritable.handlers.close();
      done();
    });

    it('calls archiver', () => {
      assert.calledWith(deps['archiver'], 'tar', { gzip: true });
    });

    it('calls createWriteStream', () => {
      assert.calledWith(deps['fs-extra'].createWriteStream, 'pie.tar.gz');
    });

    it('adds error listener', () => {
      assert.calledWith(archiveInstance.on, 'error', match.func);
    });

    it('calls archive.pipe', () => {
      assert.calledWith(archiveInstance.pipe, mockWritable);
    });

    it('calls archive.glob', () => {
      assert.calledWith(archiveInstance.glob, '**', { cwd: 'dir', ignore: [] });
    });

    it('calls addExtras', () => {
      assert.calledWith(addExtras, archiveInstance);
    });

    it('calls archive.finalize', () => {
      assert.called(archiveInstance.finalize);
    });
  });
});