import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('DefaultElementInstaller', () => {


  let mod, deps, stat, npm, installer;

  beforeEach(() => {
    stat = {
      isFile: stub(),
      isDirectory: stub()
    };

    npm = {
      installIfNeeded: stub().returns(Promise.resolve({}))
    };

    deps = {
      'fs-extra': {
        ensureDirSync: stub(),
        existsSync: stub().returns(true),
        statSync: stub().returns(stat)
      },
      '../npm': {
        default: stub().returns(npm)
      }
    }
    mod = proxyquire('../../../lib/install/element-installer', deps);

    installer = new mod.default('cwd');
  });

  describe('install', () => {


    describe('local package w/ no model', () => {
      it('returns install info', () => {
        return installer.install({ 'my-el': '../path' })
          .then(results => {
            expect(results[0]).to.eql({
              element: 'my-el',
              input: {
                element: 'my-el', value: '../path'
              },
              npmInstall: undefined,
              preInstall: {
                element: 'my-el',
                hasModel: false,
                local: true,
                type: 'package',
                value: '../../path'
              },
              pie: undefined
            });
          });
      });
    });

    describe('local package w/ model', () => {
      it('returns the install info', () => {
        return installer.install({ 'my-el': '../path' }, [{ element: 'my-el' }])
          .then((results) => {
            expect(results[0]).to.eql({
              element: 'my-el',
              input: {
                element: 'my-el', value: '../path'
              },
              npmInstall: undefined,
              preInstall: {
                element: 'my-el',
                hasModel: true,
                local: true,
                type: 'package',
                value: '../../path'
              },
              pie: undefined
            });
          });
      });
    });

    describe('local package with npminstall', () => {

      beforeEach(() => {
        const result = {
          'my-el': {
            from: '../../path',
            resolved: 'file:../../path'
          }
        };
        npm.installIfNeeded.returns(Promise.resolve(result));
      });

      it('returns the install info', () => {
        return installer.install({ 'my-el': '../path' }, [{ element: 'my-el' }])
          .then((results) => {
            const r = results[0];
            expect(r).to.eql({
              element: 'my-el',
              input: { element: 'my-el', value: '../path' },
              npmInstall:
              {
                from: '../../path',
                resolved: 'file:../../path',
                dir: 'cwd/.pie',
                moduleId: 'my-el'
              },
              preInstall:
              {
                element: 'my-el',
                hasModel: true,
                local: true,
                type: 'package',
                value: '../../path'
              },
              pie: { hasConfigurePackage: true }
            });
          });
      });
    });

    describe('local pie package', () => {

      beforeEach(() => {
        deps['fs-extra'].existsSync.returns(true)
        const result = {
          'my-el': {
            from: '../../path',
            resolved: 'file:../../path'
          }
        };
        npm.installIfNeeded.returns(Promise.resolve(result));
      });

      it('returns the install info', () => {
        return installer.install({ 'my-el': '../path' }, [{ element: 'my-el' }])
          .then((results) => {
            const r = results[0];
            expect(r).to.a.eql({
              element: 'my-el',
              input: { element: 'my-el', value: '../path' },
              npmInstall:
              {
                from: '../../path',
                resolved: 'file:../../path',
                dir: 'cwd/.pie',
                moduleId: 'my-el'
              },
              preInstall:
              {
                element: 'my-el',
                hasModel: true,
                local: true,
                type: 'package',
                value: '../../path'
              },
              pie: { hasConfigurePackage: true }
            });
          });
      });
    });
  });

  describe('remote pie package', () => {

    beforeEach(() => {
      deps['fs-extra'].existsSync = spy(function (p) {
        const out = p.indexOf('x@1.0.0') === -1;
        return out;
      });

      const result = {
        'my-el': {
          from: 'x@1.0.0',
          version: '1.0.0',
          resolved: 'https://registry.npmjs.org/x/-x.tgz'
        }
      };
      npm.installIfNeeded.returns(Promise.resolve(result));
    });

    it('returns the install info', () => {
      return installer.install({ 'my-el': 'x@1.0.0' }, [{ element: 'my-el' }])
        .then((results) => {
          const r = results[0];
          expect(r).to.eql({
            element: 'my-el',
            input: {
              element: 'my-el',
              value: 'x@1.0.0'
            },
            npmInstall: {
              dir: 'cwd/.pie',
              from: 'x@1.0.0',
              moduleId: 'my-el',
              resolved: 'https://registry.npmjs.org/x/-x.tgz',
              version: '1.0.0'
            },
            pie: {
              hasConfigurePackage: true
            },
            preInstall: {
              element: 'my-el',
              hasModel: true,
              local: false,
              type: 'package',
              value: 'x@1.0.0'
            }
          });
        });
    });
  });
});