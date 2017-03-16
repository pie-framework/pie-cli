import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

const ROOT = '../../../lib';

let cmdStub = () => {
  return {
    match: stub().returns(true),
    run: stub().returns(Promise.resolve('done'))
  }
}

let defaultCmdStub = () => {
  return {
    default: cmdStub()
  }
}

describe('cli', () => {
  let mod, deps, help;

  beforeEach(() => {

    help = cmdStub();
    deps = {
      'fs-extra': {
        existsSync: stub(),
        readJsonSync: stub()
      },
      './info': defaultCmdStub(),
      './help': {
        Help: stub().returns(help)
      },
      './version': defaultCmdStub(),
      './clean': defaultCmdStub(),
      './pack': defaultCmdStub(),
      './serve': defaultCmdStub(),
      './manifest': defaultCmdStub(),
      './configuration': {
        default: {
          app: {
            dependencies: {
              a: '1.0.0'
            }
          }
        }
      }
    }

    mod = proxyquire(`${ROOT}/cli`, deps);
  });

  describe('default', () => {

    it('merges the loaded config with the default config', () => {

      deps['fs-extra'].existsSync.returns(true);
      deps['fs-extra'].readJsonSync.returns({
        app: {
          dependencies: {
            b: '1.0.0'
          }
        }
      });

      let dependencies = { a: '1.0.0', b: '1.0.0' }
      return mod.default().then(() => {
        configuration: {
          app: {
            dependencies: dependencies
          }
        }
      });
    });
  });
});