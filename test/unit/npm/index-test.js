import { assert, match, spy, stub } from 'sinon';

import crypto from 'crypto';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('npm', () => {

  let mod, deps, Npm, npm;

  beforeEach(() => {
    deps = {
      '../io': {
        spawnPromise: stub().returns({ stdout: '{}' })
      },
      'fs-extra': {
        writeJson: stub(),
        readJsonSync: stub(),
        existsSync: stub().returns(true)
      }

    }

    mod = proxyquire('../../../lib/npm', deps);
    Npm = mod.default;
    npm = new Npm('dir');
  });

  describe('installIfNeeded', () => {
    it('installs via a new installation', () => {

      deps['../io'].spawnPromise.returns(Promise.resolve({
        stdout: JSON.stringify({
          dependencies: {
            a: {
              from: '1.0.0'
            }
          }
        })
      }));

      npm.resolveModuleIds = stub().returns([{
        moduleId: undefined, dir: undefined, value: 'a'
      }]);

      return npm.installIfNeeded(['a@1.0.0'])
        .then(result => {
          expect(result).to.eql({
            a: {
              from: '1.0.0',
              installationType: 'new-installation'
            }
          });
        });
    });
  });

  describe('installIfNeeded - new installation', () => {

    let result;

    beforeEach(() => {
      deps['../io'].spawnPromise.returns(Promise.resolve({
        stdout: JSON.stringify({
          dependencies: {
            a: {
              from: '1.0.0'
            }
          }
        })
      }));

      npm.resolveModuleIds = stub().returns([{
        moduleId: undefined, dir: undefined, value: 'a'
      }]);

      return npm.installIfNeeded(['a@1.0.0'])
        .then(r => result = r);
    });

    it('calls spawnPromise with npm ls a', () => {
      assert.calledWith(deps['../io'].spawnPromise, 'npm', 'dir', ['install', 'a', '--save', '--json']);
    });

    it('calls spawnPromise once', () => {
      assert.callCount(deps['../io'].spawnPromise, 1);
    });

    it('installs via a existing installation', () => {
      expect(result).to.eql({
        a: {
          from: '1.0.0',
          installationType: 'new-installation'
        }
      });
    });
  });

  describe('installIfNeeded - existing installation', () => {
    let result;

    beforeEach(() => {
      deps['../io'].spawnPromise.returns(Promise.resolve({
        stdout: JSON.stringify({
          dependencies: {
            a: {
              from: '1.0.0'
            }
          }
        })
      }));

      npm.resolveModuleIds = stub().returns([{
        moduleId: 'a', dir: 'dir', value: 'a'
      }]);

      return npm.installIfNeeded(['a@1.0.0'])
        .then(r => result = r);
    });

    it('calls spawnPromise with npm ls a', () => {
      assert.calledWith(deps['../io'].spawnPromise, 'npm', 'dir', ['ls', 'a', '--json']);
    });

    it('calls spawnPromise once', () => {
      assert.callCount(deps['../io'].spawnPromise, 1);
    });

    it('installs via a existing installation', () => {
      expect(result).to.eql({
        a: {
          from: '1.0.0',
          installationType: 'existing-installation'
        }
      });
    });
  });

  describe('ls', () => {
    let result;
    beforeEach(() => {
      return npm.ls('a')
        .then(r => result = r);
    });

    it('calls spawnPromise ls', () => {
      assert.calledWith(deps['../io'].spawnPromise, 'npm', 'dir', ['ls', 'a', '--json']);
    });

  });
});