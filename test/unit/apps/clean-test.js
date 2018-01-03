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
      './load-app': {
        '@noCallThru': true,
        allApps: stub().returns([])
      },
      './common': {
        removeFiles: stub().returns(Promise.resolve([]))
      }
    };

    mod = proxyquire('../../../lib/apps/clean', deps);

  });


  describe('clean', () => {

    beforeEach(() => mod.clean('dir'));

    it('calls allApps', () => {
      assert.called(deps['./load-app'].allApps);
    });

    it('calls removeFiles', () => {
      assert.calledWith(deps['./common'].removeFiles, match.string, ['.pie']);
    });
  });
});