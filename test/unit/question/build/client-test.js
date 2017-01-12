import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import { stubs } from './stubs';
import path from 'path';

describe('ClientBuild', () => {

  let mod, ClientBuild, instance, expectedConfig;

  beforeEach(() => {
    mod = stubs('question/build/client', {});
    ClientBuild = mod.default;
    instance = new ClientBuild({ dir: 'dir' }, []);
    expectedConfig = {
      context: 'dir',
      entry: instance.entryJsPath,
      module: {
        rules: []
      },
      output: { filename: 'out.js', path: 'dir' }
    };
  });

  describe('constructor', () => {

    it('creates new NpmDir', () => {
      assert.calledWith(mod.deps('npm-dir').default, 'dir');
    });
  });

  describe('install', () => {

    beforeEach(() => instance.install());

    it('calls npmDir.install', () => {
      assert.calledWith(mod.deps('npm-dir').instance.install,
        'tmp-client-package',
        match.object,
        match.object
      )
    });
  });

  describe('build', () => {
    let result;
    beforeEach(() => instance.build('//js..', 'out.js').then(r => result = r));

    it('calls fs-extra writeFileSync', () => {
      let writeFileSync = mod.deps('fs-extra').writeFileSync;
      assert.calledWith(
        writeFileSync,
        path.join('dir', instance.entryJsPath),
        '//js..',
        'utf8'
      )
    });

    it('returns the file out', () => {
      expect(result).to.eql('out.js');
    });

    it('calls buildWebpack', () => {
      assert.calledWith(mod.deps('webpack-builder').build, expectedConfig);
    });

    describe('with writeWebpackConfig=true', () => {

      it('calls buildWebpack', () => {
        instance = new ClientBuild({ dir: 'dir' }, [], true);
        return instance.build('//js..', 'out.js')
          .then(() => {
            assert.calledWith(mod.deps('webpack-write-config').writeConfig, 'dir/.client.webpack.config.js', match.object);
          });
      });
    });
  });

  describe('webpackConfig', () => {
    let config;

    beforeEach(() => {
      config = instance.webpackConfig('//js...', 'out.js');
    });

    it('calls fs-extra writeFileSync', () => {
      let writeFileSync = mod.deps('fs-extra').writeFileSync;
      assert.calledWith(
        writeFileSync,
        path.join('dir', instance.entryJsPath),
        '//js...',
        'utf8');
    });

    it('returns the config', () => {
      expect(config).to.eql(expectedConfig);
    });
  });
});