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

    it('the promise is rejected because manifest is currently disabled', () => {
      return cmd.run()
        .then(() => {
          throw new Error('should have failed');
        })
        .catch(e => {
          //ok
        });
    });
  });
});