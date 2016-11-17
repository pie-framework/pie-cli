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
      dir._exists = sinon.stub();
    });

    it('writes package.json when installing', (done) => {

      withCloseHandler(() => {
        dir.install({})
          .then(() => {
            sinon.assert.calledWith(fs.writeJsonSync, path.join(__dirname, 'package.json'), sinon.match.object);
            done();
          })
          .catch(done);
      });
    });

    it('calls \'npm install\' in a child_process', (done) => {
      withCloseHandler(() => {
        dir.install({})
          .then(() => {
            sinon.assert.calledWith(childProcess.spawn, 'npm', ['install'], { cwd: __dirname });
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
      dir._exists = sinon.stub();
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
            sinon.assert.calledWith(childProcess.spawn, 'npm', ['install', 'a@1.0.0'], { cwd: __dirname });
            done();
          }).catch(done);

      });
    });
  })
});