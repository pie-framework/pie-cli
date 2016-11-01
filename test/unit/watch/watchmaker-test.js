import { expect } from 'chai';
import proxyquire from 'proxyquire'
import sinon from 'sinon';

describe('watchmaker', () => {

  let watchmaker, pieWatchConstructor, watcherStub;


  beforeEach(() => {

    watcherStub = {
      start: sinon.stub()
    };

    pieWatchConstructor = sinon.stub().returns(watcherStub);

    watchmaker = proxyquire('../../../src/watch/watchmaker', {
      './watchers': {
        PieWatch: pieWatchConstructor
      },
      '../npm/dependency-helper': {
         pathIsDir: sinon.stub().returns(true)
       }
    });
  });

  describe('init', () => {
    it('returns an empty array for an empty array of localDependencies', () => {
      let watchers = watchmaker.init({ localDependencies: [] });
      expect(watchers.length).to.eql(0);
    });

    it('returns an empty array for a null localDependencies', () => {
      let watchers = watchmaker.init({ localDependencies: null });
      expect(watchers.length).to.eql(0);
    });

    describe('with 1 local dependency', () => {
      let watchers, dep;

      beforeEach(() => {
        dep = sinon.stub();
        let localDependencies = { local: dep };
        watchers = watchmaker.init({ dir: '', localDependencies: localDependencies });
      });

      it('returns 1 watcher', () => {
        expect(watchers.length).to.eql(1);
      });

      it('calls constructor', () => {
        sinon.assert.calledWith(pieWatchConstructor, 'local', dep, '');
      });

      it('calls start', () => {
        sinon.assert.called(watcherStub.start);
      });

    });
  });
});