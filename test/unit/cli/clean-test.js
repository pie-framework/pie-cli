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
      '../apps/load-app': {
        allApps: stub().returns([])
      },
      '../apps/common': {
        removeFiles: stub().returns(Promise.resolve([]))
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

    it('calls allApps', () => {
      assert.called(deps['../apps/load-app'].allApps);
    });

    it('calls removeFiles', () => {
      assert.calledWith(deps['../apps/common'].removeFiles, match.string, ['.pie']);
    });
  });
});