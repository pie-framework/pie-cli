import { expect } from 'chai';
import {stub, assert, spy, match} from 'sinon';
import proxyquire from 'proxyquire';
import path from 'path';

describe('npm-dir', () => {

  let NpmDir, fs, childProcess, spawned, handlers;
  beforeEach(() => {
    handlers = {};

    spawned = {
      on: spy(function (name, handler) {
        handlers[name] = handler;
      })
    }

    fs = {
      writeJsonSync: stub(),
      existsSync: stub().returns(true)
    }

    childProcess = {
      spawn: stub().returns(spawned)
    }

    NpmDir = proxyquire('../../../lib/npm/npm-dir', {

      'fs-extra': fs,
      'child_process': childProcess,
      'readline': {
        createInterface: stub().returns({
          on: stub()
        })
      },
      '../file-helper': {
        removeFiles: stub()
      }
    }).default;
  });

  describe('constructor', () => {

    it('has rootDir', () => {
      let dir = new NpmDir(__dirname);
      expect(dir.rootDir).to.eql(__dirname);
    });
  });

  describe('install', () => {

    let dir;
    beforeEach(() => {
      dir = new NpmDir(__dirname);
      dir._exists = stub();
    });

    it('writes package.json when installing', (done) => {

      withCloseHandler(() => {
        dir.install({})
          .then(() => {
            assert.calledWith(fs.writeJsonSync, path.join(__dirname, 'package.json'), match.object);
            done();
          })
          .catch(done);
      });
    });

    it('calls \'npm install\' in a child_process', (done) => {
      withCloseHandler(() => {
        dir.install({})
          .then(() => {
            assert.calledWith(childProcess.spawn, 'npm', ['install'], { cwd: __dirname });
            done();
          })
          .catch(done);
      });
    });
  });

  let withCloseHandler = (bodyFn) => {
    bodyFn();
    let close = () => {
      if (handlers.close) {
        handlers.close(0);
      } else {
        setTimeout(close);
      }
    }
    close();
  }

  describe('installMoreDependencies', () => {
    let dir;
    beforeEach(() => {
      dir = new NpmDir(__dirname);
      dir._exists = stub();
    });

    it('skips the install if all the dependencies exist', (done) => {

      withCloseHandler(() => {
        dir._exists
          .withArgs('node_modules/a').returns(true)
          .withArgs('node_modules/b').returns(true);

        dir.installMoreDependencies({ a: '1.0.0', b: '1.0.0' })
          .then((result) => {
            expect(result.skipped).to.eql(true);
            done();
          }).catch(done);

      });
    });

    it('calls \'npm install a@1.0.0\'', (done) => {

      withCloseHandler(() => {
        dir._exists
          .withArgs('node_modules/a').returns(false)
          .withArgs('node_modules/b').returns(true);

        dir.installMoreDependencies({ a: '1.0.0', b: '1.0.0' })
          .then(() => {
            assert.calledWith(childProcess.spawn, 'npm', ['install', 'a@1.0.0'], { cwd: __dirname });
            done();
          }).catch(done);

      });
    });
  });

  describe('ls', () => {

    let dir;

    let call = (firstExistsSyncResult, done) => {
        dir = new NpmDir(__dirname);
        fs.existsSync
          .onFirstCall().returns(firstExistsSyncResult)
          .onSecondCall().returns(true);

        dir._spawnPromise = stub().returns(Promise.resolve({stdout: '{}'}));
        dir._install = stub().returns(Promise.resolve());
        dir.ls()
         .then(done.bind(null, null))
         .catch(done);
    }

    describe('when installed', () => {

      beforeEach((done) => {
        call(true, done);
      });

      it('does not call _install', () => {
        assert.notCalled(dir._install);
      });

      it('calls _spawnPromise', () => {
        assert.calledWith(dir._spawnPromise, ['ls', '--json'], true);
      });
    });

    describe('when not installed', () => {

      beforeEach((done) => {
        call(false, done);
      });

      it('calls _install', () => {
        assert.called(dir._install);
      });

      it('calls _spawnPromise', () => {
        assert.calledWith(dir._spawnPromise, ['ls', '--json'], true);
      });
    });
  });
});