import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import { stubs, Sandbox } from './stubs';
import path from 'path';

describe('all-in-one', () => {

  let AllInOne, instance, mod, client, controllers, supportConfig, jsonConfig, expectedConfig;

  beforeEach(() => {

    client = {
      install: stub()
    };

    controllers = {
      install: stub()
    };

    let deps = {
      './client': {
        instance: client,
        default: stub().returns(client)
      },
      './controllers': {
        instance: controllers,
        default: stub().returns(controllers)
      }

    };

    supportConfig = {
      webpackLoaders: () => []
    }

    jsonConfig = {
      dir: 'dir'
    }

    mod = stubs('question/build/all-in-one', deps);
    AllInOne = mod.default;
    instance = new AllInOne(jsonConfig, supportConfig, 'entry.js', 'fileout.js');

    expectedConfig = {
      context: 'dir',
      entry: instance.entryPath,
      output: {
        filename: 'fileout.js', path: 'dir'
      },
      module: {
        loaders: []
      },
      resolve: {
        modules: [
          path.resolve('dir/controllers/node_modules'),
          'node_modules'
        ],
        extensions: ['.js', '.jsx']
      }
    };

  });

  describe('constructor', () => {

    it('calls new ClientBuild', () => {
      assert.calledWith(mod.deps('client').default, { dir: 'dir' }, []);
    });

    it('calls new ControllersBuild', () => {
      assert.calledWith(mod.deps('controllers').default, { dir: 'dir' });
    });
  });

  describe('install', () => {
    beforeEach((done) => {
      instance.install({ dependencies: {}, devDependencies: {} })
        .then(() => done())
        .catch(done);
    });

    it('calls client.install', () => {
      assert.calledWith(mod.deps('client').instance.install, {}, {});
    });

    it('calls controllers.install', () => {
      assert.called(mod.deps('controllers').instance.install);
    });

  });

  describe('webpackConfig', () => {
    let config;

    beforeEach(() => {
      config = instance.webpackConfig('//js...')
    });

    it('calls writeFileSync', () => {
      assert.calledWith(mod.deps('fs-extra').writeFileSync, path.join('dir', instance.entryPath), '//js...', 'utf8');
    });

    it('returns the config', () => {
      expect(config).to.eql(expectedConfig);
    });
  });

  describe('build', () => {
    beforeEach(() => {
      return instance.build('//js...');
    });

    it('calls writeFileSync', () => {
      assert.calledWith(mod.deps('fs-extra').writeFileSync, path.join('dir', instance.entryPath), '//js...', 'utf8');
    });

    it('calls buildWebpack', () => {
      assert.calledWith(mod.deps('webpack-builder').build, expectedConfig);
    });

    describe('with writeWebpackConfig', () => {
      beforeEach(() => {
        instance = new AllInOne(jsonConfig, supportConfig, 'entry.js', 'fileout.js', true);
        return instance.build('//js...');
      });

      it('calls writeWebpackConfig', () => {
        let configPath = path.join('dir', '.all-in-one.webpack.config.js');
        assert.calledWith(mod.deps('webpack-write-config').writeConfig, configPath, match.object);
      });
    });
  });

  describe('js', () => {

    const vm = require('vm');
    let sandbox;

    beforeEach(() => {
      let js = instance.js([{ js: `exports.foo = 'foo'` }]);
      sandbox = new Sandbox();
      sandbox.customElements = {};
      let script = new vm.Script(js, {});
      script.runInNewContext(sandbox);
    });

    it('adds the declarations js', () => {
      expect(sandbox.exports.foo).to.eql('foo');
    });
  });
});