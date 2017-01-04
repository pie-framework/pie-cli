import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';

const ROOT = '../../../lib';

describe('info', () => {
  let mod, cmd, deps;
  beforeEach(() => {
    deps = {
      '../apps/load-app': {
        default: stub().returns({
          server: stub().returns({})
        })
      },
      '../apps/server/utils': {
        startServer: stub().returns({})
      }
    };
    mod = proxyquire(`${ROOT}/cli/info`, deps);
    cmd = mod.default;
  });

  describe('run', () => {
    it('adds {app:info} to the run args', () => {
      return cmd.run({ logLevel: 'silly' }).then(() => {
        assert.calledWith(deps['../apps/load-app'].default,
          { logLevel: 'silly', app: 'info' });
      });
    });

    it('overrides {app:info} if app is set in the args', () => {
      return cmd.run({ app: 'default' }).then(() => {
        assert.calledWith(deps['../apps/load-app'].default, { app: 'info' });
      });
    });
  });
});