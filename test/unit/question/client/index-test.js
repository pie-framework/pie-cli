import {expect} from 'chai'; 
import proxyquire from 'proxyquire';
import sinon from 'sinon';
describe('client', () => {
  let index, npmDirConstructor, npmDirInstance, entryConstructor;

  beforeEach(() => {
    npmDirInstance = {};
    npmDirConstructor = sinon.stub().returns(npmDirInstance);
    entryConstructor = sinon.stub().returns({});
    
    index = proxyquire('../../../../src/question/client', {
      '../../npm/npm-dir' : {
        default: npmDirConstructor
      },
      './entry' : {
        default: entryConstructor
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

    });
  });

});