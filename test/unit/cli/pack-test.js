import * as types from '../../../lib/apps/types';

import { assert, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('pack', () => {

  let mod, cmd, app, deps;

  beforeEach(() => {

    app = {
      build: stub().returns('done'),
      manifest: stub().returns('done'),
      config: {
        dir: 'dir'
      }
    }

    deps = {
      '../apps': {
        loadApp: stub().returns(app),
        clean: stub().returns(Promise.resolve([]))
      },
      './report' : {
        default: {
          promise: spy(p => p)
        }
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

    describe('with defaults', () => {
      beforeEach(() => cmd.run({}));

      it('calls loadApp', () => {
        assert.calledWith(deps['../apps'].loadApp, {});
      });

      it('calls app.build', () => {
        assert.calledWith(app.build, types.BuildOpts.build({}));
      });

      it('does not call clean', () => {

        assert.notCalled(deps['../apps'].clean);
      });
    }); 

    describe('with --clean', () => {
      beforeEach(() => cmd.run({ clean: true }));

      it('calls clean', () => {
        assert.calledWith(deps['../apps'].clean, 'dir');
      });
    });
  });

});