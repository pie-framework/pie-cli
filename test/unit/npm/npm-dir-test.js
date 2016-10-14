import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import path from 'path';

describe('npm-dir', () => {

  let NpmDir, fs, childProcess, spawned, handlers;
  beforeEach(() => {
    handlers = {};

    spawned = {
      on: sinon.spy(function (name, handler) {
        handlers[name] = handler;
      })
    }

    fs = {
      writeJsonSync: sinon.stub()
    }

    childProcess = {
      spawn: sinon.stub().returns(spawned)
    }

    NpmDir = proxyquire('../../../src/npm/npm-dir', {

      'fs-extra': fs,
      'child_process': childProcess,
      'readline': {
        createInterface: sinon.stub().returns({
          on: sinon.stub()
        })
      },
      '../file-helper': {
        removeFiles: sinon.stub()
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
      dir._exists = sinon.stub()
        .withArgs('package.json').returns(false)
        .withArgs('node_modules').returns(false);
    });

    it('skips install if package.json and node_modules exists', (done) => {

      dir._exists
        .withArgs('package.json').returns(true)
        .withArgs('node_modules').returns(true);

      dir.install({})
        .then((result) => {
          expect(result.skipped).to.eql(true);
          done();
        })
        .catch(done);

      setTimeout(function () {
        handlers.close(0);
      })
    });

    it('writes package.json when installing', (done) => {

      dir.install({})
        .then(() => {
          sinon.assert.calledWith(fs.writeJsonSync, path.join(__dirname, 'package.json'), sinon.match.object);
          done();
        })
        .catch(done);
      //trigger 
      setTimeout(function () {
        handlers.close(0);
      })
    });

    it('calls \'npm install\' in a child_process', (done) => {

      dir.install({})
        .then(() => {
          sinon.assert.calledWith(childProcess.spawn, 'npm', ['install'], { cwd: __dirname });
          done();
        })
        .catch(done);

      setTimeout(function () {
        handlers.close(0);
      });
    });
  });

  describe('installMoreDependencies', () => {
    let dir;
    beforeEach(() => {
      dir = new NpmDir(__dirname);
      dir._exists = sinon.stub();
    });

    it('skips the install if all the dependencies exist', (done) => {
      dir._exists
        .withArgs('node_modules/a').returns(true)
        .withArgs('node_modules/b').returns(true);

      dir.installMoreDependencies({ a: '1.0.0', b: '1.0.0' })
        .then((result) => {
          expect(result.skipped).to.eql(true);
          done();
        }).catch(done);

      setTimeout(function () {
        handlers.close(0);
      });

      it('calls \'npm install a@1.0.0\'', (done) => {
        dir._exists
          .withArgs('node_modules/a').returns(false)
          .withArgs('node_modules/b').returns(true);

        dir.installMoreDependencies({ a: '1.0.0', b: '1.0.0' })
          .then(() => {
            sinon.assert.calledWith(childProcess.spawn, 'npm', ['install', 'a@1.0.0'], { cwd: __dirname });
            done();
          }).catch(done);

        setTimeout(function () {
          handlers.close(0);
        });
      });
    })
  });
});