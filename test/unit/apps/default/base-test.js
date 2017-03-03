import * as _ from 'lodash';
import * as path from 'path';

import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

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
    createArchive,
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

    createArchive = {
      createArchive: stub().returns(Promise.resolve(archiveInstance)),
      archiveIgnores: stub().returns([])
    }

    const { getNames } = require(`${ROOT}/apps/common`);

    deps = {
      '../../question/build/all-in-one': {
        default: allInOne
      },
      '../create-archive': createArchive,
      'fs-extra': {
        writeFileSync: stub(),
        createReadStream: stub(),
        createWriteStream: stub()
      },
      'express': express,
      'webpack': stub().returns(compiler),
      'webpack-dev-middleware': stub().returns({})
    };

    mod = proxyquire(`${ROOT}/apps/default/base`, deps);

    jsonConfig = {
      dir: 'dir', filenames: {
        json: 'config.json', markup: 'index.html'
      }
    };

    supportConfig = {
      webpackLoaders: stub().returns([])
    }

    BaseApp = mod.BaseApp;
    names = getNames({});
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

    let run = (keepBuildAssets, forceInstall) => {
      forceInstall = forceInstall === undefined ? false : forceInstall;
      app.install = stub().returns(Promise.resolve());
      app.buildAllInOne = stub().returns(Promise.resolve([]));
      app.removeBuildAssets = stub().returns(Promise.resolve([]))
      return app.build({ keepBuildAssets, forceInstall })
        .then(r => result = r);
    }

    describe('with keepBuildAssets=false', () => {
      beforeEach(() => run(false));

      it('calls install', () => {
        assert.calledWith(app.install, false);
      });

      it('calls buildAllInOne', () => {
        assert.called(app.buildAllInOne);
      });

      it('calls removeBuildAssets', () => {
        assert.calledOnce(app.removeBuildAssets);
      });
    });

    describe('with forceInstall', () => {
      beforeEach(() => run(false, true));
      it('calls install with forceInstal = true', () => {
        assert.calledWith(app.install, true);
      });
    });

    describe('with keepBuildAssets=true', () => {
      beforeEach(() => run(true));

      it('does not call removeBuildAssets', () => {
        assert.notCalled(app.removeBuildAssets);
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

});