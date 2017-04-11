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
        loadApp: stub().returns(app),
        clean: stub().returns(Promise.resolve([]))
      },
      '../server': {
        startServer: startServer
      },
      '../watch/watchmaker': {
        init: init
      },
      './report' : {
        default: {
          promise: spy(p => p)
        }
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
    
    it('does not call clean', () => {
      assert.notCalled(deps['../apps'].clean);
    });

  });
  

  describe('run with --clean', () => {
    beforeEach(() => cmd.run({ clean: true, dir: 'dir' }));

    it('calls clean', () => {
      assert.calledWith(deps['../apps'].clean, 'dir');
    });
  });
});