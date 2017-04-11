import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('clean', () => {

  let cmd, app, mod, deps;

  beforeEach(() => {

    app = {
      clean: stub().returns('done')
    }

    deps = {
      '../apps/clean': {
        clean: stub().returns(Promise.resolve([]))
      },
      './report' : {
        default: {
          promise: spy(p => p)
        }
      }
    };

    mod = proxyquire('../../../lib/cli/clean', deps);

    cmd = mod.default;
  });

  describe('match', () => {

    it('returns true for clean', () => {
      expect(cmd.match({ _: ['clean'] })).to.eql(true);
    });
  });

  describe('run', () => {

    beforeEach(() => cmd.run({}));

    it('calls clean', () => {
      assert.called(deps['../apps/clean'].clean)
    });

  });
});