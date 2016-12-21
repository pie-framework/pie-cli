import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import { stubs, Sandbox } from './stubs';
import path from 'path';

describe('ControllersBuild', () => {

  let mod, ControllersBuild, instance;

  beforeEach(() => {
    mod = stubs('question/build/controllers', {});
    ControllersBuild = mod.default;
    instance = new ControllersBuild({
      dir: 'dir', installedPies: [
        { controllerDir: 'controller', key: 'pkg' }
      ]
    });
  });

  describe('constructor', () => {

    it('calls ensureDirSync', () => {
      assert.calledWith(
        mod.deps('fs-extra').ensureDirSync,
        path.join('dir/controllers')
      )
    });
  });

  describe('build', () => {

    let result;

    beforeEach((done) => {
      instance.build('out.js', 'lib')
        .then(r => {
          result = r;
          done();
        })
        .catch(done);
    });

    it('writes out the entry.js', () => {
      assert.calledWith(
        mod.deps('fs-extra').writeFileSync,
        path.join('dir/controllers', instance.entryJsPath),
        match.string,
        'utf8');
    });

    it('calls buildWebpack', () => {
      assert.calledWith(
        mod.deps('webpack-builder').build,
        match.object
      )
    });

    it('returns the filename', () => {
      expect(result).to.eql('out.js');
    });
  });

  describe('install', () => {
    beforeEach((done) => {
      instance.install()
        .then(() => done())
        .catch(done);
    });

    it('calls npmDir.install', () => {
      assert.calledWith(
        mod.deps('npm-dir').instance.install,
        'tmp-controllers-package',
        {
          'pkg-controller': '../../controller'
        },
        {}
      )
    });
  });

  describe('entryJs', () => {

    const vm = require('vm');
    let sandbox;

    beforeEach(() => {
      sandbox = new Sandbox()
      let script = new vm.Script(instance.entryJs, {});
      script.runInNewContext(sandbox);
    });

    it('exports a controller', () => {
      expect(sandbox.exports['pkg']).to.not.be.undefined;
    });

    it('exports a controller version', () => {
      expect(sandbox.exports['pkg'].version).to.eql('../../controller');
    });

    it('calls require', () => {
      assert.calledWith(sandbox.require, 'pkg-controller');
    })
  });
});