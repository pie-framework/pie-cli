import { assert, match, spy, stub } from 'sinon';

import { Base } from '../helper';
import { expect } from 'chai';
import { path as p } from '../../../../lib/string-utils';
import path from 'path';
import proxyquire from 'proxyquire';

const ROOT = '../../../../lib';

describe('item app', () => {
  let ItemApp, instance, mod, args, deps, config, supportConfig, middlewareInstance, routerInstance, express, compiler, dirs, session;

  beforeEach(() => {

    dirs = {
      root: 'dir',
      configure: '.configure',
      controllers: './controllers'
    };

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
      '../../code-gen': {
        writeConfig: stub(),
        writeEntryJs: stub().returns(Promise.resolve())
      },
      '../../install': {
        '@noCallThru': true,
        default: stub()
      }
    }

    mod = proxyquire(`${ROOT}/apps/item`, deps);

    ItemApp = mod.default;

    args = {};

    config = {
      dir: 'dir',
      declarations: [],
      models: stub()
    };

    supportConfig = {
      externals: {
        js: [],
        css: []
      }
    };
    session = {
      array: []
    }

    instance = new ItemApp(config, supportConfig, session);
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
        install: stub().returns(Promise.resolve({ pkgs: [], dirs }))
      }
      return instance.server({});
    });

    it('calls intaller.install', () => {
      assert.calledWith(instance.installer.install, undefined);
    });

    it('calls writeEntryJs', () => {
      assert.calledWith(deps['../../code-gen'].writeEntryJs, p`${dirs.root}/item.entry.js`, match.string);
    });

    it('calls webpackConfig', () => {
      assert.calledWith(deps['../common'].webpackConfig, match.object, match.object, 'item.entry.js', 'item.bundle.js');
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

    });
  });
});