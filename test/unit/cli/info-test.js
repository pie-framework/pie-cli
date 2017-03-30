import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

const ROOT = '../../../lib';

describe('info', () => {
  let mod, cmd, deps;

  beforeEach(() => {
    deps = {
      '../apps': {
        clean: stub().returns(Promise.resolve([])),
        loadApp: stub().returns({
          server: stub().returns({}),
          watchableFiles: stub().returns([])
        })
      },
      '../server': {
        startServer: stub().returns(Promise.resolve({}))
      },
      '../watch/watchmaker': {
        init: stub().returns(Promise.resolve())
      },
      './report': {
        default: {
          promise: spy(p => p)
        }
      }
    };
    mod = proxyquire(`${ROOT}/cli/info`, deps);
    cmd = mod.default;
  });

  describe('run', () => {
    it('adds {app:info} to the run args', () => {
      return cmd.run({ logLevel: 'silly' }).then(() => {
        assert.calledWith(deps['../apps'].loadApp,
          { logLevel: 'silly', app: 'info' });
      });
    });

    it('overrides {app:info} if app is set in the args', () => {
      return cmd.run({ app: 'default' }).then(() => {
        assert.calledWith(deps['../apps'].loadApp, { app: 'info' });
      });
    });

    it('does not call clean', () => {
      assert.notCalled(deps['../apps'].clean);
    });
  });
  

  describe('run with --clean', () => {
    beforeEach(() => cmd.run({ clean: true }));

    it('calls clean', () => {
      assert.calledWith(deps['../apps'].clean, match(/.*docs\/demo$/));
    });
  });
});