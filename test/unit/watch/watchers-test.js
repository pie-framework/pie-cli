import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire'
import { resolve } from 'path';

describe('watchers', () => {

  let watchers, baseWatch, chokidar, chokidarWatcher, fs;

  beforeEach(() => {
    class MockWatcher {
      constructor() {
        this.handlers = {};

        this.on = spy((key, handler) => {
          this.handlers[key] = handler;
          return this;
        });
      }

      run(key, path) {
        if (this.handlers[key]) {
          this.handlers[key](path);
        }
      }
    }

    chokidarWatcher = new MockWatcher();

    chokidar = {
      watch: stub().returns(chokidarWatcher)
    };

    fs = {
      copy: stub(),
      remove: stub()
    }

    watchers = proxyquire('../../../lib/watch/watchers', {
      chokidar: chokidar,
      'fs-extra': fs
    });
  });

  describe('BaseWatch', () => {

    beforeEach(() => {
      baseWatch = new watchers.BaseWatch([/ignore/]);
      baseWatch.srcRoot = 'srcRoot';
      baseWatch.targetRoot = 'targetRoot';
    });

    describe('constructor', () => {

      it('constructs', () => {
        expect(baseWatch).not.eql(undefined);
      });

      it('has ignores', () => {
        expect(baseWatch.ignores).to.eql([/ignore/]);
      });
    });

    describe('start', () => {

      beforeEach(() => {
        baseWatch.start();
      });

      it('calls chokidar.watch', () => {
        assert.calledWith(chokidar.watch, 'srcRoot', match.any);
      });

      describe('changes', () => {

        it('add calls fs.copy', () => {
          chokidarWatcher.run('add', 'path');
          assert.calledWith(fs.copy, 'path');
        });

        it('change calls fs.copy', () => {
          chokidarWatcher.run('change', 'path');
          assert.calledWith(fs.copy, 'path');
        });

        it('unlink calls fs.remove', () => {
          chokidarWatcher.run('unlink', 'path');
          assert.calledWith(fs.remove, 'path');
        });
      });
    });

  });


  describe('FileWatch', () => {
    let watch, onChange;

    beforeEach(() => {
      onChange = stub();
      watch = new watchers.FileWatch('path', onChange);
    });

    describe('constructor', () => {
      it('is not undefined', () => {
        expect(watch).not.to.be.undefined;
      });
    });

    describe('start', () => {

      beforeEach(() => {
        watch.start();
        chokidarWatcher.run('change', 'path');
      });

      it('calls chokidar.watch', () => {
        assert.calledWith(chokidar.watch, 'path', { ignoreInitial: true });
      });

      it('calls onChange handler', () => {
        assert.calledWith(onChange, 'path');
      });
    });
  });

  describe('PackageWatch', () => {

    let watch;

    beforeEach(() => {
      watch = new watchers.PackageWatch('my-pie', '../../my-pie', './.pie', []);
    });

    describe('constructor', () => {
      it('is not undefined', () => {
        expect(watch).not.eql(undefined);
      });

      it('has controllers in ignored', () => {
        expect(watch.ignores).to.eql([]);
      });
    });

    describe('srcRoot', () => {
      it('points to the pie controller dir', () => {
        expect(watch.srcRoot).to.eql('../../my-pie');
      });
    });

    describe('targetRoot', () => {
      it('points to the target', () => {
        expect(watch.targetRoot).to.eql(resolve('./.pie/node_modules/my-pie'));
      });
    });
  });

  describe('PieControllerWatch', () => {
    let watch;

    beforeEach(() => {
      watch = new watchers.PieControllerWatch('../../my-pie', './.pie/.controllers', 'my-pie-controller');
    });

    describe('constructor', () => {
      it('is not null', () => {
        expect(watch).not.eql(undefined);
      })
    });

    describe('srcRoot', () => {
      it('points to the pie controller dir', () => {
        expect(watch.srcRoot).to.eql(resolve('.', '../../my-pie/controller'));
      });
    });

    describe('targetRoot', () => {
      it('points to the target', () => {
        expect(watch.targetRoot).to.eql(resolve('./.pie/.controllers/node_modules/my-pie-controller'));
      });
    });
  });

  describe('PieConfigureWatch', () => {
    let watch;

    beforeEach(() => {
      watch = new watchers.PieConfigureWatch('../../my-pie', './.pie/.configure', 'my-pie-configure');
    });

    describe('constructor', () => {
      it('is not null', () => {
        expect(watch).not.eql(undefined);
      })
    });

    describe('srcRoot', () => {
      it('points to the pie controller dir', () => {
        expect(watch.srcRoot).to.eql(resolve('.', '../../my-pie/configure'));
      });
    });

    describe('targetRoot', () => {
      it('points to the target', () => {
        expect(watch.targetRoot).to.eql(resolve('./.pie/.configure/node_modules/my-pie-configure'));
      });
    });
  });

  describe('PieWatch', () => {

    let watch, dirs, targets;
    beforeEach(() => {
      dirs = {
        root: '.pie',
        controllers: '.pie/.controllers',
        configure: '.pie/.configure'
      }

      targets = {
        controller: 'my-pie-controller',
        configure: 'my-pie-configure'
      }

      watch = new watchers.PieWatch('my-pie', '.', '../../my-pie', dirs, targets);
      watch.client = {
        start: stub()
      }
      watch.controller = {
        start: stub()
      }
      watch.configure = {
        start: stub()
      }
    });

    it('constructs', () => {
      expect(watch).not.eql(undefined);
    });

    describe('start', () => {

      beforeEach(() => {
        watch.start();
      });

      it('calls client.start', () => {
        assert.called(watch.client.start);
      });

      it('calls controller.start', () => {
        assert.called(watch.controller.start);
      });
      it('calls configure.start', () => {
        assert.called(watch.configure.start);
      });
    });
  });
});