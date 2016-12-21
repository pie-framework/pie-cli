import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { assert, stub, spy } from 'sinon';
import { loadStubApp, runCmd, types } from './helper';

describe('pack', () => {

  let cmd,
    cmdResult,
    stubbed,
    app;

  beforeEach(() => {


    app = {
      build: stub().returns('done'),
      manifest: stub().returns('done')
    }

    stubbed = loadStubApp('../../../lib/cli/pack', app);
    cmd = stubbed.module.default;
  });

  describe('match', () => {

    it('returns true for pack', () => {
      expect(cmd.match({ _: ['pack'] })).to.eql(true);
    });
  });

  describe('run', () => {

    beforeEach((done) => runCmd(cmd, {}, done));

    it('calls loadApp', () => {
      assert.calledWith(stubbed.loadApp, {});
    });

    it('calls app.build', () => {
      assert.calledWith(app.build, types.BuildOpts.build({}));
    });

    it('calls app.manifest', () => {
      assert.calledWith(app.manifest, types.ManifestOpts.build({}));
    });
  });

});