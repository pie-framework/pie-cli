import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('serve', () => {
  let cmd, app, startServer, init, deps, mod;

  beforeEach(() => {

    startServer = stub().returns(Promise.resolve({}));
    init = stub();

    app = {
      server: stub().returns('done'),
      config: {}
    }

    deps = {
      '../apps': {
        loadApp: stub().returns(app)
      },
      '../server': {
        startServer: startServer
      },
      '../watch/watchmaker': {
        init: init
      }
    }

    mod = proxyquire('../../../lib/cli/serve', deps)
    cmd = mod.default;
  });

  describe('run', () => {

    let result;

    beforeEach(() => cmd.run({}));

    it('calls loadApp', () => {
      assert.calledWith(deps['../apps'].loadApp, { app: 'item' });
    });

    it('calls app.server', () => {
      assert.calledWith(app.server, match.object);
    });

    it('calls startServer', () => {
      assert.calledWith(startServer, 4000, match.any);
    });

    it('calls initWatch', () => {
      assert.calledWith(init, app.config, undefined);
    });

  });
});