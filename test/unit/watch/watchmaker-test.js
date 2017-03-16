import { assert, match, stub } from 'sinon';

import _ from 'lodash';
import { expect } from 'chai';
import proxyquire from 'proxyquire'

describe('watchmaker', () => {

  let watchmaker,
    pieWatchConstructor,
    pieWatch,
    fileWatch,
    watcherStub,
    fileWatchConstructor,
    questionConfig,
    elements,
    dirs,
    mappings;

  beforeEach(() => {
    elements = require('../../../lib/question/config/elements');
    elements.StubPiePackage = class StubPiePackage extends elements.PiePackage {
      constructor() {
        super('stub', '../..');
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
        return {
          start: stub()
        }
      }
    }

    class StubFileWatch extends watchers.FileWatch {
      constructor() {
        return {
          start: stub()
        }
      }
    }

    pieWatch = new StubPieWatch()
    pieWatchConstructor = stub().returns(pieWatch);
    fileWatch = new StubFileWatch();

    fileWatchConstructor = stub().returns(fileWatch);


    mappings = {
      controllers: [{ pie: 'stub', target: 'stub-controller' }],
      configure: [{ pie: 'stub', target: 'stub-configure' }]
    }

    dirs = {
      root: 'dir/.pie',
      controllers: 'dir/.pie/controllers',
      configure: 'dir/.pie/configure'
    }

    watchmaker = proxyquire('../../../lib/watch/watchmaker', {
      './watchers': {
        PieWatch: pieWatchConstructor,
        FileWatch: fileWatchConstructor
      }
    });
  });

  describe('init', () => {
    it('returns an empty array for an empty array of localDependencies', () => {
      let watchers = watchmaker.init(questionConfig([]), stub(), [], mappings, dirs);
      expect(watchers.dependencies.length).to.eql(0);
    });

    it('returns an empty array for a null localDependencies', () => {
      let watchers = watchmaker.init(questionConfig(null), stub(), [], mappings, dirs);
      expect(watchers.dependencies.length).to.eql(0);
    });

    describe('with 1 local dependency', () => {
      let watchers, dep;

      beforeEach(() => {
        dep = stub();
        watchers = watchmaker.init(
          questionConfig([new elements.StubPiePackage()]),
          stub(),
          [],
          mappings,
          dirs);
      });

      it('returns 1 watcher', () => {
        expect(watchers.dependencies.length).to.eql(1);
      });

      it('calls constructor', () => {
        assert.calledWith(pieWatchConstructor, 'stub', 'dir', '../..', dirs, { controller: 'stub-controller', configure: 'stub-configure' });
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