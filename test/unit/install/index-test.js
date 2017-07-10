import { assert, match, spy, stub } from 'sinon';

import { ElementDeclaration } from '../../../lib/code-gen';
import { expect } from 'chai';
import { path as p } from '../../../lib/string-utils';
import proxyquire from 'proxyquire';

describe('install', () => {
  let mod, deps, buildInfo, installedElement, npm;

  beforeEach(() => {

    npm = {
      installIfNeeded: stub().returns(Promise.resolve([]))
    }

    deps = {
      'fs-extra': {
        ensureDirSync: stub()
      },
      '../npm': {
        default: stub().returns(npm)
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
      npmInstall: {
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


  describe('findModuleId', () => {

    it('returns the module id', () => {
      const out = mod.findModuleId(
        'my-el',
        [{ moduleId: 'my-el', path: '../path/my-el/configure' }],
        {
          'my-el-configure': {
            from: '../path/my-el/configure'
          }
        }
      );
      expect(out).to.eql('my-el-configure');
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

        install.elementInstaller.install = stub().returns(Promise.resolve([installedElement]));
        install.installControllers = stub().returns(Promise.resolve([]));
        install.installConfigure = stub().returns(Promise.resolve([]));

        return install.install(false)
          .then(r => result = r);
      });


      it('returns buildInfo', () => {
        expect(result[0]).to.eql({
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

    describe('installPieSubPackage', () => {
      beforeEach(() => {

        npm.installIfNeeded.returns(Promise.resolve({
          'my-el-controller': {
            from: '.pie/node_modules/my-el-module-id/controller'
          }
        }));
        return install.installPieSubPackage([installedElement], 'controller', 'dir');
      });

      it('adds pie controller dir', () => {
        expect(installedElement.pie.controller.dir).to.eql('dir');
      });

      it('adds pie controller moduleId', () => {
        expect(installedElement.pie.controller.moduleId).to.eql('my-el-controller');
      });
    });
  });
});