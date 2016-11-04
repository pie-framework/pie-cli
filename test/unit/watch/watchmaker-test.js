import { expect } from 'chai';
import proxyquire from 'proxyquire'
import sinon from 'sinon';
import _ from 'lodash';

describe('watchmaker', () => {

  let watchmaker, pieWatchConstructor, watcherStub, fileWatchConstructor;


  let questionConfig = (locals) => {
    return {
      localDependencies: locals,
      dir: 'dir',
      filenames: {
        config: 'config.json',
        markup: 'index.html'
      }
    }
  }

  beforeEach(() => {


    watcherStub = {
      start: sinon.stub()
    };

    pieWatchConstructor = sinon.stub().returns(watcherStub);
    fileWatchConstructor = sinon.stub().returns({});

    watchmaker = proxyquire('../../../src/watch/watchmaker', {
      './watchers': {
        PieWatch: pieWatchConstructor,
        FileWatch: fileWatchConstructor
      },
      '../npm/dependency-helper': {
        pathIsDir: sinon.stub().returns(true)
      }
    });
  });

  describe('init', () => {
    it('returns an empty array for an empty array of localDependencies', () => {
      let watchers = watchmaker.init(questionConfig([]));
      expect(watchers.dependencies.length).to.eql(0);
    });

    it('returns an empty array for a null localDependencies', () => {
      let watchers = watchmaker.init(questionConfig(null));
      expect(watchers.dependencies.length).to.eql(0);
    });

    describe('with 1 local dependency', () => {
      let watchers, dep;

      beforeEach(() => {
        dep = sinon.stub();
        watchers = watchmaker.init(questionConfig({ local: dep }), () => { });
      });

      it('returns 1 watcher', () => {
        expect(watchers.dependencies.length).to.eql(1);
      });

      it('calls constructor', () => {
        sinon.assert.calledWith(pieWatchConstructor, 'local', dep, 'dir');
      });

      it('calls start', () => {
        sinon.assert.called(watcherStub.start);
      });

      it('calls file watch constructor for index.html', () => {
        sinon.assert.calledWith(fileWatchConstructor, 'dir/index.html', sinon.match.func);
      });

      it('calls file watch constructor for config.json', () => {
        sinon.assert.calledWith(fileWatchConstructor, 'dir/config.json', sinon.match.func);
      });

    });
  });
});