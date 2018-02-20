import { assert, match, stub, spy } from 'sinon';

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
          markup: 'index.html',
          resolveConfig: spy(function (dir) { return `${dir}/config.json` })
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
    pieWatchConstructor = spy(function () {
      // console.log('arguments: ', arguments);
      return pieWatch;
    });

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
      let watchers, dep, questionCfg;

      beforeEach(() => {
        dep = stub();
        questionCfg = questionConfig();
        watchers = watchmaker.init(
          questionCfg,
          stub(),
          [],
          [{
            isLocal: true,
            input: {
              element: 'element',
              value: 'input'
            },
            element: {
              moduleId: 'main'
            },
            rootModuleId: 'root-moduleId',
            controller: {
              moduleId: 'controller'
            },
            configure: {
              moduleId: 'configure-module-id'
            }
          }],
          dirs);
      });

      it('returns 1 watcher', () => {
        expect(watchers.dependencies.length).to.eql(1);
      });

      it('calls constructor', () => {
        assert.calledWith(pieWatchConstructor, { moduleId: 'main' }, 'root-moduleId', 'dir', 'input', dirs, match.object, match.object);
      });

      it('calls start', () => {
        assert.called(pieWatch.start);
      });

      it('calls file watch constructor for index.html', () => {
        assert.calledWith(fileWatchConstructor, p`dir/index.html`, match.func);
      });

      it('calls resolveConfig', () => {
        assert.calledWith(questionCfg.filenames.resolveConfig, 'dir');
      });

      it('calls file watch constructor for config.json', () => {
        assert.calledWith(fileWatchConstructor, p`dir/config.json`, match.func);
      });

    });
  });
});