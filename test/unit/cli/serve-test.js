import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { spy, stub, assert, match } from 'sinon';
import { loadStubApp, runCmd, types } from './helper.js';

describe('serve', () => {
  let cmd, stubbed, app, startServer, init;

  beforeEach(() => {

    startServer = stub();
    init = stub();

    app = {
      server: stub().returns('done'),
      config: {}
    }

    stubbed = loadStubApp('../../../lib/cli/serve', app, {
      '../apps/server/utils': {
        startServer: startServer
      },
      '../watch/watchmaker': {
        init: init
      }
    });
    cmd = stubbed.module.default;
  });

  describe('run', () => {

    let result;

    beforeEach((done) => runCmd(cmd, {}, done));

    it('calls loadApp', () => {
      assert.calledWith(stubbed.loadApp, {});
    });

    it('calls app.server', () => {
      assert.calledWith(app.server, types.ServeOpts.build({}));
    })

    it('calls startServer', () => {
      assert.calledWith(startServer, 4000, match.any);
    });

    it('calls initWatch', () => {
      assert.calledWith(init, app.config, undefined);
    });

  });
});