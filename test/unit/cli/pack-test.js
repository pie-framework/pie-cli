import * as types from '../../../lib/apps/types';

import { assert, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('pack', () => {

  let mod, cmd, app, deps;

  beforeEach(() => {

    app = {
      build: stub().returns('done'),
      manifest: stub().returns('done')
    }

    deps = {
      '../apps': {
        loadApp: stub().returns(app)
      }
    }

    mod = proxyquire('../../../lib/cli/pack', deps);
    cmd = mod.default;
  });

  describe('match', () => {

    it('returns true for pack', () => {
      expect(cmd.match({ _: ['pack'] })).to.eql(true);
    });
  });

  describe('run', () => {

    beforeEach(() => cmd.run({}));

    it('calls loadApp', () => {
      assert.calledWith(deps['../apps'].loadApp, {});
    });

    it('calls app.build', () => {
      assert.calledWith(app.build, types.BuildOpts.build({}));
    });

    it('calls app.manifest', () => {
      assert.calledWith(app.manifest, types.ManifestOpts.build({}));
    });
  });

});