import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

const ROOT = '../../../lib';

describe('info', () => {
  let mod, cmd, deps;

  beforeEach(() => {
    deps = {
      '../apps': {
        loadApp: stub().returns({
          server: stub().returns({}),
          watchableFiles: stub().returns([])
        })
      },
      '../server': {
        startServer: stub().returns({})
      },
      '../watch/watchmaker': {
        init: stub().returns(Promise.resolve())
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
  });
});