import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import path from 'path';
import proxyquire from 'proxyquire';

describe('npm-dir', () => {

  let NpmDir, fs, io, spawned, handlers;
  beforeEach(() => {
    handlers = {};

    spawned = {
      on: spy(function (name, handler) {
        handlers[name] = handler;
      })
    }

    fs = {
      writeJsonSync: stub(),
      existsSync: stub().returns(true),
      ensureDirSync: stub()
    }

    io = {
      spawnPromise: stub().returns(Promise.resolve({ stdout: '{}' }))
    }

    NpmDir = proxyquire('../../../lib/npm/npm-dir', {

      'fs-extra': fs,
      '../io': io,
      'readline': {
        createInterface: stub().returns({
          on: stub()
        })
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

    it('writes package.json when installing', () => {
      return dir.install({})
        .then(() => {
          assert.calledWith(fs.writeJsonSync, path.join(__dirname, 'package.json'), match.object);
        });
    });

    it('calls \'npm install\' in a child_process', () => {
      fs.existsSync.returns(false);
      return dir.install({})
        .then(() => {
          assert.calledWith(io.spawnPromise, dir.cmd, __dirname, ['install'], false);
        });
    });

    it('skips calling \'npm install\' in a child_process if node_modules exists', () => {
      fs.existsSync.returns(true);
      return dir.install({})
        .then(() => {
          assert.notCalled(io.spawnPromise);
        });
    });

    it('calls \'npm install\' in a child_process if node_modules exists and force = true', () => {
      fs.existsSync.returns(true);
      return dir.install('name', {}, {}, true)
        .then(() => {
          assert.calledWith(io.spawnPromise, dir.cmd, __dirname, ['install'], false);
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

      dir.spawnPromise = stub().returns(Promise.resolve({ stdout: '{}' }));
      dir.install = stub().returns(Promise.resolve());
      dir.runInstallCmd = stub().returns(Promise.resolve());
      dir.ls()
        .then(done.bind(null, null))
        .catch(done);
    }

    describe('when installed', () => {

      beforeEach((done) => {
        call(true, done);
      });

      it('does not call install', () => {
        assert.notCalled(dir.install);
      });

      it('calls spawnPromise', () => {
        assert.calledWith(dir.spawnPromise, ['ls', '--json'], true);
      });
    });

    describe('when not installed', () => {

      beforeEach((done) => {
        call(false, done);
      });

      it('calls install', () => {
        assert.called(dir.runInstallCmd);
      });

      it('calls spawnPromise', () => {
        assert.calledWith(dir.spawnPromise, ['ls', '--json'], true);
      });
    });
  });
});