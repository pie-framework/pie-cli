import { expect } from 'chai';
import { stub, assert, spy, match } from 'sinon';
import proxyquire from 'proxyquire';
import path from 'path';

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
      existsSync: stub().returns(true)
    }

    io = {
      spawnPromise: stub().returns(Promise.resolve({}))
    }

    NpmDir = proxyquire('../../../lib/npm/npm-dir', {

      'fs-extra': fs,
      '../io': io,
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

    it('writes package.json when installing', () => {
      return dir.install({})
        .then(() => {
          assert.calledWith(fs.writeJsonSync, path.join(__dirname, 'package.json'), match.object);
        });
    });

    it('calls \'npm install\' in a child_process', () => {
      return dir.install({})
        .then(() => {
          assert.calledWith(io.spawnPromise, 'npm', __dirname, ['install'], false);
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

      dir._spawnPromise = stub().returns(Promise.resolve({ stdout: '{}' }));
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