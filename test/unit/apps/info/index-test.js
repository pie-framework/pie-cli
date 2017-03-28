import { assert, match, spy, stub } from 'sinon';

import { Base } from '../helper';
import { expect } from 'chai';
import path from 'path';
import proxyquire from 'proxyquire';

const ROOT = '../../../../lib';

describe('info app', () => {
  let InfoApp, instance, mod, args, deps, config, supportConfig, middlewareInstance, routerInstance, express, compiler;

  beforeEach(() => {

    routerInstance = {
      use: stub(),
      get: stub()
    }

    middlewareInstance = {
      waitUntilValid: stub()
    }

    compiler = {
      plugin: stub()
    }

    express = stub().returns(routerInstance);
    express.Router = stub().returns(routerInstance);

    deps = {
      'express': express,
      'http': {
        createServer: stub().returns({})
      },
      'fs-extra': {
        writeFileSync: stub(),
        readFileSync: stub().returns(''),
        readJsonSync: stub().returns({
          name: 'name',
          version: 'version',
          repository: {
            url: 'url'
          }
        })
      },
      webpack: stub().returns(compiler),
      'webpack-dev-middleware': stub().returns(middlewareInstance),
      '../../server': {
        default: stub()
      },
      '../common': {
        webpackConfig: stub().returns({
          module: {
            rules: [
              { test: /\.css$/, use: 'css-loader' }
            ]
          }
        })
      },
      '../../code-gen/webpack-write-config': {
        writeConfig: stub()
      }
    }

    mod = proxyquire(`${ROOT}/apps/info`, deps);

    InfoApp = mod.default;

    args = {};

    config = {
      dir: 'dir',
      declarations: [],
      pieModels: stub(),
      elementModels: stub()
    };

    supportConfig = {
      externals: {
        js: [],
        css: []
      }
    };

    instance = new InfoApp(args, 'pie-root', config, supportConfig);
  });

  describe('constructor', () => {
    it('constructs', () => {
      expect(instance).not.to.be.undefined;
    });
  });


  describe('server', () => {

    beforeEach(() => {

      instance.router = stub();

      instance.installer = {
        dir: '.pie',
        dirs: {
          root: 'dir',
          configure: '.configure',
          controllers: './controllers'
        },
        install: stub().returns(Promise.resolve({ controllers: [], configure: [] }))
      }
      return instance.server({});
    });

    it('calls intaller.install', () => {
      assert.calledWith(instance.installer.install, undefined);
    });

    it('calls writeFileSync', () => {
      assert.calledWith(deps['fs-extra'].writeFileSync, '.pie/info.entry.js', match.string, 'utf8');
    });

    it('calls webpackConfig', () => {
      assert.calledWith(deps['../common'].webpackConfig, match.object, match.object, 'info.entry.js', 'info.bundle.js');
    });

    it('calls webpack', () => {
      assert.calledWith(deps['webpack'], match.object);
    });

    it('calls router', () => {
      assert.calledWith(instance.router, compiler);
    });
  });

  describe('router', () => {
    beforeEach(() => {
      instance.router({});
    });

    it('calls express.Router', () => {
      assert.called(deps['express'].Router);
    });

    it('calls webpackMiddleware', () => {
      assert.calledWith(deps['webpack-dev-middleware'], match.object, {
        noInfo: true,
        quiet: true,
        publicPath: '/'
      });
    });

    it('calls router.use', () => {
      assert.calledWith(routerInstance.use, middlewareInstance);
    });

    describe('GET /', () => {
      let handler, res;
      beforeEach(() => {

        res = {}
        res.set = stub().returns(res);
        res.status = stub().returns(res);
        res.send = stub();

        instance.template = stub();
        instance.installer = {
          installedPies: []
        }
        routerInstance.get = spy(function (path, h) {
          handler = h;
        });
        instance.router({});
        handler({}, res);
      });

      it('calls template', () => {
        assert.called(instance.template);
      });

      it('calls readJsonSync for package.json', () => {
        assert.calledWith(deps['fs-extra'].readJsonSync, 'pie-root/package.json');
      });

      it('calls readFileSync for README.md', () => {
        assert.calledWith(deps['fs-extra'].readFileSync, 'pie-root/README.md');
      });
    });
  });
});