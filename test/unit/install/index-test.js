import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import { path as p } from '../../../lib/string-utils';
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
        getInstalledPies: stub().returns([{ key: 'pie' }])
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
      elements: [
        { key: 'pie', value: 'pie' },
        { key: 'local-file', value: './local-file' }
      ],
      models: stub().returns([
        { id: '1', element: 'pie' },
        { id: '2', element: 'local-file' }
      ])
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
        install: stub().returns(Promise.resolve([{ pie: 'pie', target: 'pie' }]))
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
      assert.calledWith(installer.configure.install, [{ key: 'pie' }], false);
    });

    it('calls controllers.install', () => {
      assert.calledWith(installer.controllers.install, [{ key: 'pie' }], false);
    });

    it('returns the mappings', () => {
      expect(mappings).to.eql({
        configure: [], controllers: [
          { pie: 'pie', target: 'pie' },
          { pie: 'local-file', target: 'pie-controller/lib/passthrough' }
        ]
      });
    });
  });

  describe('get installedPies', () => {


    it('calls getInstalledPies', () => {
      installer.installedPies;
      assert.calledWith(deps['../question/config'].getInstalledPies, p`dir/.pie/node_modules`, ['pie', 'local-file']);
    })
  });
});