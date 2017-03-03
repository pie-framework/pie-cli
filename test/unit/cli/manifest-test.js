import { assert, stub } from 'sinon';
import { loadStubApp, runCmd } from './helper';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('manifest', () => {
  let cmd, app, stubbed, cmdResult;

  beforeEach(() => {
    app = {
      manifest: stub().returns('done'),
      build: stub()
    }

    stubbed = loadStubApp('../../../lib/cli/manifest', app);
    cmd = stubbed.module.default;
  });

  describe('run', () => {

    describe('with dir', () => {
      beforeEach((done) => runCmd(cmd, {}, done));

      it('calls loadApp', () => {
        assert.calledWith(stubbed.loadApp, {});
      });

      it('calls app.manifest', () => {
        assert.calledWith(app.manifest, { dir: process.cwd(), outfile: undefined });
      });
    });

    describe('with dir and outfile', () => {
      beforeEach((done) => runCmd(cmd, { dir: 'dir', outfile: 'out.json' }, done));

      it('calls loadApp', () => {
        assert.calledWith(stubbed.loadApp, { dir: 'dir', outfile: 'out.json' });
      });

      it('calls app.manifest', () => {
        assert.calledWith(app.manifest, { dir: 'dir', outfile: 'out.json' });
      });
    });

    describe('with dir', () => {
      beforeEach((done) => runCmd(cmd, { dir: 'dir' }, done));

      it('calls loadApp', () => {
        assert.calledWith(stubbed.loadApp, { dir: 'dir' });
      });

      it('calls app.manifest', () => {
        assert.calledWith(app.manifest, { dir: 'dir', outfile: undefined });
      });
    });
  });
});