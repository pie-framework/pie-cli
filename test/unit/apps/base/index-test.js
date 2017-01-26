import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import * as _ from 'lodash';
import * as path from 'path';

const ROOT = '../../../../lib';

describe('BaseApp', function () {

  let mod,
    deps,
    BaseApp,
    instance,
    jsonConfig,
    supportConfig,
    allInOne,
    names,
    app,
    compiler,
    expressApp,
    result,
    archiveInstance;

  let handle = (p) => p;

  beforeEach(() => {

    allInOne = stub();
    allInOne.js = stub().returns('//js...');
    allInOne.returns(allInOne);

    compiler = {}

    expressApp = {
      set: stub(),
      use: stub()
    }

    let express = stub().returns(expressApp);

    express.Router = stub().returns({
      use: stub(),
      get: stub()
    });

    archiveInstance = {
      glob: stub(),
      directory: stub(),
      file: stub(),
      pipe: stub(),
      finalize: stub(),
      on: stub(),
      pointer: stub()
    }

    deps = {
      '../../question/build/all-in-one': {
        default: allInOne
      },
      'archiver': stub().returns(archiveInstance),
      'fs-extra': {
        writeFileSync: stub(),
        createReadStream: stub()
      },
      'express': express,
      'webpack': stub().returns(compiler),
      'webpack-dev-middleware': stub().returns({})
    };

    mod = proxyquire(`${ROOT}/apps/base/index`, deps);

    jsonConfig = {
      dir: 'dir', filenames: {
        json: 'config.json', markup: 'index.html'
      }
    };

    supportConfig = {
      webpackLoaders: stub().returns([])
    }

    BaseApp = mod.BaseApp;
    names = mod.getNames({});
    app = new BaseApp({
      configuration: {
        app: {
          dependencies: {}
        }
      }
    }, jsonConfig, supportConfig, names);
  });

  describe('constructor', () => {

    it('builds', () => {
      expect(app).not.to.be.undefined;
    });

    it('creates new AllInOneBuild', () => {
      assert.calledWith(allInOne,
        jsonConfig,
        supportConfig,
        names.build.entryFile,
        names.out.completeItemTag.path)
    });

    it('sets the branch', () => {
      expect(new BaseApp({ pieBranch: 'blah' }, jsonConfig, supportConfig, names).branch).to.eql('blah');
    });

  });

  describe('build', () => {

    let run = (keepBuildAssets) => {
      app.install = stub().returns(Promise.resolve());
      app.buildAllInOne = stub().returns(Promise.resolve([]));
      app.removeBuildAssets = stub().returns(Promise.resolve([]))
      return app.build({ keepBuildAssets: keepBuildAssets })
        .then(r => result = r);
    }

    describe('with keepBuildAssets=false', () => {
      beforeEach(() => run(false));

      it('calls install', () => {
        assert.called(app.install);
      });

      it('calls buildAllInOne', () => {
        assert.called(app.buildAllInOne);
      });

      it('calls removeBuildAssets', () => {
        assert.calledOnce(app.removeBuildAssets);
      });
    });

    describe('with keepBuildAssets=true', () => {
      beforeEach(() => run(true));

      it('does not call removeBuildAssets', () => {
        assert.notCalled(app.removeBuildAssets);
      });
    });
  });

  describe('server', () => {

    beforeEach(() => {
      app.install = stub().returns(Promise.resolve());
      app.prepareWebpackJs = stub().returns('');
      app.allInOneBuild = {
        webpackConfig: stub().returns({})
      }
      app.router = stub().returns({ router: true });
      app._linkCompilerToServer = stub();
      app.mkServer = stub().returns({ server: true, httpServer: {} });
      return app.server().then(r => result = r);
    });

    it('calls install', () => {
      assert.calledOnce(app.install);
    });

    it('calls prepareWebpackJs', () => {
      assert.calledOnce(app.prepareWebpackJs);
    });

    it('calls allInOneBuild.webpackConfig', () => {
      assert.calledOnce(app.allInOneBuild.webpackConfig);
    });

    it('calls webpack', () => {
      assert.calledOnce(deps.webpack);
    });

    it('calls router', () => {
      assert.calledWith(app.router, {});
    });

    it('calls express()', () => {
      assert.calledOnce(deps.express);
    });

    it('calls express.use, router', () => {
      assert.calledWith(expressApp.use, { router: true });
    });

    it('calls app.mkServer', () => {
      assert.calledOnce(app.mkServer);
    });

    it('calls _linkCompilerToServer', () => {
      assert.calledWith(app._linkCompilerToServer, 'main', {}, { server: true, httpServer: {} });
    });

    it('returns server', () => {
      expect(result.server).to.eql({});
    });

    it('returns reload', () => {
      expect(_.isFunction(result.reload)).to.be.true;
    });

    describe('reload handler', () => {

      beforeEach(() => {
        app.config.reload = stub();
        app.writeBundledItem = stub();
        result.reload(path.join(app.config.dir, app.config.filenames.json));
      });

      it('calls config.reload', () => {
        assert.called(app.config.reload);
      });

      it('calls writeBundledItem', () => {
        assert.called(app.writeBundledItem);
      });
    });
  });

  describe('buildAllInOne', () => {

    beforeEach(() => {
      app.prepareWebpackJs = stub().returns('//js...');
      app.allInOneBuild.build = stub().returns(Promise.resolve({ file: 'out.js' }));
      app.buildExample = stub().returns('example.html');
      return app.buildAllInOne().then(r => result = r);
    });

    it('calls prepareWebpackJs', () => {
      assert.calledOnce(app.prepareWebpackJs);
    });

    it('calls allInOneBuild.build', () => {
      assert.calledWith(app.allInOneBuild.build, '//js...');
    });

    it('calls allInOneBuild.build', () => {
      assert.calledOnce(app.buildExample);
    });

    it('returns the files', () => {
      expect(result).to.eql(['out.js', 'example.html']);
    });
  });

  describe('declarations', () => {

    it('returns the declarations', () => {
      expect(app.declarations.length).to.eql(3);
    });

    it('adds pie-player', () => {
      expect(_.find(app.declarations, d => d.key === 'pie-player')).not.to.be.undefined;
    });

    it('adds pie-control-panel', () => {
      expect(_.find(app.declarations, d => d.key === 'pie-control-panel')).not.to.be.undefined;
    });

    it('adds item tag', () => {
      expect(_.find(app.declarations, d => d.key === names.out.completeItemTag.name)).not.to.be.undefined;
    });
  });

  describe('prepareWebpackJs', () => {
    beforeEach(() => {
      app.allInOneBuild.controllerMapSrc = '//js...';
      app.writeBundledItem = stub();
      app.allInOneBuild.js = stub().returns('//js...');
      result = app.prepareWebpackJs();
    });

    it('calls writeFileSync', () => {
      assert.calledWith(deps['fs-extra'].writeFileSync, path.join('dir', app.names.build.controllersMap), '//js...');
    });

    it('calls writeBundledItem', () => {
      assert.calledOnce(app.writeBundledItem);
    });

    it('calls allInOneBuild.js', () => {
      assert.calledWith(app.allInOneBuild.js, app.declarations);
    });

    it('returns the src', () => {
      expect(result).to.eql('//js...');
    });
  });

  describe('buildExample', () => {
    beforeEach(() => {
      app.fileMarkup = stub().returns('markup');
      result = app.buildExample();
    });

    it('calls fileMarkup', () => {
      assert.calledOnce(app.fileMarkup);
    });

    it('calls writeFileSync', () => {
      let filepath = path.join('dir', app.names.out.example);
      assert.calledWith(deps['fs-extra'].writeFileSync, filepath, 'markup', 'utf8');
    });

    it('returns the file name', () => {
      expect(result).to.eql(app.names.out.example);
    });
  });

  describe('router', () => {
    let router, handlers;
    beforeEach(() => {
      handlers = {};
      router = {
        use: stub(),
        get: spy(function (path, handler) {
          handlers[path] = handler;
        })
      };

      deps.express.Router = stub().returns(router);
      app.router({});
    });

    it('calls express.Router', () => {
      assert.calledOnce(deps.express.Router);
    });

    it('calls webpackDevMiddleware', () => {
      assert.calledWith(deps['webpack-dev-middleware'], {}, { publicPath: '/', noInfo: true });
    });

    it('calls router.use', () => {
      assert.calledWith(router.use, match.object);
    })

    it('calls router.get', () => {
      assert.calledWith(router.get, '/', match.func);
    });

    describe('get handler', () => {
      let res;
      beforeEach(() => {
        app.serverMarkup = stub().returns('<html></html>');
        res = {};
        res.set = stub().returns(res);
        res.status = stub().returns(res);
        res.send = stub().returns(res);
        handlers['/']({}, res);
      });

      it('calls serverMarkup', () => {
        assert.calledOnce(app.serverMarkup);
      });

      it('calls send', () => {
        assert.calledWith(res.send, '<html></html>');
      });
    });
  });

  describe('install', () => {
    beforeEach(() => {
      app.allInOneBuild.install = stub();
      app.install().then(r => result = r);
    });

    it('calls allInOneBuild.install', () => {
      assert.calledWith(app.allInOneBuild.install, {
        dependencies: match.object,
        devDependencies: match.object
      });
    });
  });


  describe('manifest', () => {
    it('calls writeFileSync', () => {
      app.config.manifest = {};
      app.manifest({ outfile: 'manifest.json' });
      assert.calledWith(deps['fs-extra'].writeFileSync, 'manifest.json', {}, 'utf8');
    })
  });

  describe('_linkCompilerToServer', () => {
    let compiler, handlers, registeredHandlers;
    beforeEach(() => {
      registeredHandlers = {};
      compiler = {
        plugin: spy((key, handler) => {
          registeredHandlers[key] = handler;
        })
      }

      handlers = {
        error: stub(),
        reload: stub()
      }
      app._linkCompilerToServer('name', compiler, handlers);
    });

    it('calls compiler.plugin', () => {
      assert.calledWith(compiler.plugin, 'done', match.func);
    });

    it('done handler calls reload', (done) => {
      registeredHandlers['done']({
        hasErrors: () => false
      });

      process.nextTick(() => {
        assert.calledWith(handlers.reload, 'name');
        done();
      })
    });

    it('done handler calls error', (done) => {
      registeredHandlers['done']({
        hasErrors: () => true,
        toJson: stub().returns({ errors: [] })
      });

      process.nextTick(() => {
        assert.calledWith(handlers.error, 'name', []);
        done();
      })
    });
  });

  describe('createArchive', () => {

    let writeStream, handlers = {};

    beforeEach((done) => {

      app.addExtrasToArchive = stub();

      writeStream = {
        on: (key, handler) => handlers[key] = handler
      }

      deps['fs-extra'].createWriteStream = stub().returns(writeStream);
      app.createArchive();
      handlers.close();
      done();
    });

    it('inits the archive', () => {
      assert.calledWith(deps['archiver'], 'tar', { gzip: true });
    });

    it('calls archive glob', () => {
      assert.calledWith(archiveInstance.glob, '**', match.object);
    });

    it('calls addExtrasToArchive', () => {
      assert.called(app.addExtrasToArchive);
    });

    it('calls archive finalize', () => {
      assert.called(archiveInstance.finalize);
    });
  });
});