import {expect} from 'chai'; 
import proxyquire from 'proxyquire';
import sinon from 'sinon';
describe('client', () => {
  let index, npmDirConstructor, npmDirInstance, entryConstructor, entryInstance, removeFiles;

  beforeEach(() => {
    npmDirInstance = {
      clean: sinon.stub().returns(Promise.resolve())
    };

    npmDirConstructor = sinon.stub().returns(npmDirInstance);

    entryInstance = {
      clean: sinon.stub().returns(Promise.resolve())
    }

    entryConstructor = sinon.stub().returns(entryInstance);
    
    removeFiles = sinon.stub().returns(Promise.resolve());

    index = proxyquire('../../../../src/question/client', {
      '../../npm/npm-dir' : {
        default: npmDirConstructor
      },
      './entry' : {
        default: entryConstructor
      },
      '../../file-helper' : {
        removeFiles: removeFiles
      }
    });
  });

  describe('BuildOpts', () => {

    let BuildOpts;

    beforeEach(() => {
      BuildOpts = index.BuildOpts;
    });

    it('builds with default pieBranch', () => {
      expect(BuildOpts.build().pieBranch).to.eql('develop');
    });

    it('builds with default bundleName', () => {
      expect(BuildOpts.build().bundleName).to.eql('pie.js');
    });
  });

  describe('ClientBuildable', () => {

    let ClientBuildable, buildable;

    beforeEach(() => {
      ClientBuildable = index.ClientBuildable;
    });

    describe('constructor', () => {
      beforeEach(() => {
        buildable = new ClientBuildable({ dir: 'dir'}, [], {});
      });

      it('calls new NpmDir', () => {
        sinon.assert.calledWith(npmDirConstructor, 'dir');
      });

      it('calls new Entry', () => {
        sinon.assert.calledWith(entryConstructor, 'dir');
      });
    });

    describe('clean', () => {

      beforeEach((done) => {
        buildable = new ClientBuildable({ dir: 'dir'}, [], { bundleName: 'pie.js'});
        buildable.clean()
          .then(() => done())
          .catch(done);
      });

      it('calls npmDir.clean', () => {
        sinon.assert.called(npmDirInstance.clean);
      });
      
      it('calls entry.clean', () => {
        sinon.assert.called(entryInstance.clean);
      });
      
      it('calls removeFile', () => {
        sinon.assert.calledWith(removeFiles, 'dir', ['pie.js', 'pie.js.map']);
      });
    });
  });

});