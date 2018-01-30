import { assert, match, spy, stub } from 'sinon';

import { ElementDeclaration } from '../../../lib/code-gen';
import { expect } from 'chai';
import { path as p } from '../../../lib/string-utils';
import proxyquire from 'proxyquire';

describe('install', () => {
  let mod, deps, buildInfo, installedElement, npm, dirs;

  beforeEach(() => {

    dirs = {
      root: 'root',
      configure: 'configure',
      controllers: 'controllers'
    };

    npm = {
      installIfNeeded: stub().returns(Promise.resolve([]))
    }

    deps = {
      'fs-extra': {
        ensureDirSync: stub()
      },
      '../npm': {
        default: stub().returns(npm)
      },
      '@pie-cli-libs/installer': {
        install: stub().returns(Promise.resolve({ installed: [], dirs }))
      }
    };

    installedElement = {
      element: 'my-el',
      input: {
        element: 'my-el',
        value: '../path'
      },
      preInstall: {
        local: true,
        type: 'package',
        hasModel: false
      },
      postInstall: {
        moduleId: 'my-el-module-id',
        dir: 'dir/.pie'
      },
      pie: {

      }
    }

    buildInfo = [{
      element: 'my-el',
      main: {
        tag: 'my-el-tag',
        moduleId: 'my-el-moduleId'
      },
      controller: {
        moduleId: 'my-el-controller'
      },
      configure: {
        moduleId: 'my-el-configure'
      }
    }]
    mod = proxyquire('../../../lib/install', deps);
  });

  describe('controllerTargets', () => {

    it('returns a controller target', () => {

      const out = mod.controllerTargets(buildInfo);

      expect(out).to.eql([{
        pie: buildInfo[0].element,
        target: buildInfo[0].controller.moduleId
      }]);
    });
  });

  describe('pieToConfigureMap', () => {

    it('returns a configure map', () => {
      const out = mod.pieToConfigureMap(buildInfo);
      expect(out).to.eql({ 'my-el': 'my-el-configure' });
    });
  });

  describe('toDeclarations', () => {

    it('creates declarations', () => {
      const out = mod.toDeclarations(buildInfo);
      expect(out).to.eql([new ElementDeclaration(buildInfo[0].main.tag, buildInfo[0].main.moduleId)]);
    });
  });


  describe('Install', () => {
    let install, config
    beforeEach(() => {

      config = {};
      install = new mod.default('dir', config);
    });

    it('constructs', () => {
      expect(install).not.to.be.undefined;
    });

    describe('install', () => {
      let result;

      beforeEach(() => {

        deps['@pie-cli-libs/installer'].install = stub().returns(
          Promise.resolve({ dirs, installed: [installedElement] })
        );

        return install.install(false)
          .then(r => {
            result = r
          });
      });


      it('returns buildInfo', () => {
        expect(result.buildInfo[0]).to.eql({
          element: 'my-el',
          isLocal: true,
          isPackage: true,
          main: {
            dir: 'dir/.pie',
            moduleId: 'my-el-module-id',
            tag: 'my-el'
          },
          src: '../path'
        });
      });
    });

  });
});