import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('install', () => {

  let installer, mod, deps, config;
  beforeEach(() => {
    deps = {
      '../../npm': {
        NpmDir: stub(),
        pathIsDir: stub().returns(true)
      },
      '../question/config': {
        getInstalledPies: stub().returns([])
      },
      './controllers': {
        default: stub().returns({
          install: stub().returns(Promise.resolve([]))
        })
      },
      './configure': {
        default: stub().returns({
          install: stub().returns(Promise.resolve([]))
        })
      }
    }

    config = {
      dir: 'dir',
      dependencies: {},
      elements: []
    }

    mod = proxyquire('../../../lib/install/index', deps);

    installer = new mod.default(config);
  });

  describe('install', () => {
    let mappings;

    beforeEach(() => {

      installer.npm = {
        install: stub().returns(Promise.resolve({}))
      }
      installer.controllers = {
        install: stub().returns(Promise.resolve([]))
      }
      installer.configure = {
        install: stub().returns(Promise.resolve([]))
      }
      return installer.install().then(m => mappings = m);
    });

    it('calls npm.install', () => {
      assert.calledWith(installer.npm.install, 'pie-root-install', {}, {}, false);
    });

    it('calls configure.install', () => {
      assert.calledWith(installer.configure.install, [], false);
    });

    it('calls controllers.install', () => {
      assert.calledWith(installer.controllers.install, [], false);
    });

    it('returns the mappings', () => {
      expect(mappings).to.eql({ configure: [], controllers: [] });
    });
  });

  describe('get installedPies', () => {


    it('calls getInstalledPies', () => {
      installer.installedPies;
      assert.calledWith(deps['../question/config'].getInstalledPies, 'dir/.pie/node_modules', []);
    })
  });
});