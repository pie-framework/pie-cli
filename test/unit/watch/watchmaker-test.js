import { assert, match, stub } from 'sinon';

import _ from 'lodash';
import { expect } from 'chai';
import { path as p } from '../../../lib/string-utils';
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

    questionConfig = () => {
      return {
        dir: 'dir',
        filenames: {
          config: 'config.json',
          markup: 'index.html'
        }
      }
    }
  });

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
          questionConfig(),
          stub(),
          [],
          [{
            isLocal: true,
            main: {
              moduleId: 'main'
            },
            src: '../main',
            controller: {
              moduleId: 'controller'
            }
          }],
          dirs);
      });

      it('returns 1 watcher', () => {
        expect(watchers.dependencies.length).to.eql(1);
      });

      it('calls constructor', () => {
        assert.calledWith(pieWatchConstructor, 'main', 'dir', '../main', dirs, { controller: 'controller', configure: undefined });
      });

      it('calls start', () => {
        assert.called(pieWatch.start);
      });

      it('calls file watch constructor for index.html', () => {
        assert.calledWith(fileWatchConstructor, p`dir/index.html`, match.func);
      });

      it('calls file watch constructor for config.json', () => {
        assert.calledWith(fileWatchConstructor, p`dir/config.json`, match.func);
      });

    });
  });
});