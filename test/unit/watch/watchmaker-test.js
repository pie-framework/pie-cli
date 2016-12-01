import { expect } from 'chai';
import proxyquire from 'proxyquire'
import { stub, match, assert } from 'sinon';
import _ from 'lodash';

describe('watchmaker', () => {

  let watchmaker,
    pieWatchConstructor,
    pieWatch,
    fileWatch,
    watcherStub,
    fileWatchConstructor,
    questionConfig,
    elements;

  beforeEach(() => {
    elements = require('../../../lib/question/config/elements');
    elements.StubPiePackage = class StubPiePackage extends elements.PiePackage {
      constructor() {
        super('key', 'value');
      }
    }

    questionConfig = (elements) => {
      return {
        elements: elements,
        dir: 'dir',
        filenames: {
          json: 'config.json',
          markup: 'index.html'
        }
      }
    }

  })

  beforeEach(() => {


    let watchers = require('../../../lib/watch/watchers');

    class StubPieWatch extends watchers.PieWatch {
      constructor() {
        super('stub', 'stub', 'stub');
        this.start = stub();
      }
    }

    class StubFileWatch extends watchers.FileWatch {
      constructor() {
        super('', '', '');
        this.start = stub();
      }
    }

    pieWatch = new StubPieWatch()
    pieWatchConstructor = stub().returns(pieWatch);
    fileWatch = new StubFileWatch();

    fileWatchConstructor = stub().returns(fileWatch);


    watchmaker = proxyquire('../../../lib/watch/watchmaker', {
      './watchers': {
        PieWatch: pieWatchConstructor,
        FileWatch: fileWatchConstructor
      },
      '../npm/dependency-helper': {
        pathIsDir: stub().returns(true)
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
        dep = stub();
        watchers = watchmaker.init(questionConfig([new elements.StubPiePackage()]), () => { });
      });

      it('returns 1 watcher', () => {
        expect(watchers.dependencies.length).to.eql(1);
      });

      it('calls constructor', () => {
        assert.calledWith(pieWatchConstructor, 'key', 'value', 'dir');
      });

      it('calls start', () => {
        assert.called(pieWatch.start);
      });

      it('calls file watch constructor for index.html', () => {
        assert.calledWith(fileWatchConstructor, 'dir/index.html', match.func);
      });

      it('calls file watch constructor for config.json', () => {
        assert.calledWith(fileWatchConstructor, 'dir/config.json', match.func);
      });

    });
  });
});