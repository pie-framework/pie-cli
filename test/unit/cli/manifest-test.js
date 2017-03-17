import { assert, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('manifest', () => {
  let mod, cmd, app, cmdResult, deps;

  beforeEach(() => {
    app = {
      manifest: stub().returns('done'),
      build: stub()
    }

    deps = {
      '../apps': {
        loadApp: stub().returns(app)
      }
    }

    mod = proxyquire('../../../lib/cli/manifest', deps);
    cmd = mod.default;
  });

  describe('run', () => {

    describe('with dir', () => {
      beforeEach(() => cmd.run({}));

      it('calls loadApp', () => {
        assert.calledWith(deps['../apps'].loadApp, {});
      });

      it('calls app.manifest', () => {
        assert.calledWith(app.manifest, { dir: process.cwd(), outfile: undefined });
      });
    });

    describe('with dir and outfile', () => {
      beforeEach(() => cmd.run({ dir: 'dir', outfile: 'out.json' }));

      it('calls loadApp', () => {
        assert.calledWith(deps['../apps'].loadApp, { dir: 'dir', outfile: 'out.json' });
      });

      it('calls app.manifest', () => {
        assert.calledWith(app.manifest, { dir: 'dir', outfile: 'out.json' });
      });
    });

    describe('with dir', () => {
      beforeEach(() => cmd.run({ dir: 'dir' }));

      it('calls loadApp', () => {
        assert.calledWith(deps['../apps'].loadApp, { dir: 'dir' });
      });

      it('calls app.manifest', () => {
        assert.calledWith(app.manifest, { dir: 'dir', outfile: undefined });
      });
    });
  });
});