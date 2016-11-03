import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import _ from 'lodash';

describe('client', () => {
  let index, npmDirConstructor, npmDirInstance, removeFiles, frameworkSupport, emptyApp;

  beforeEach(() => {

    emptyApp = {
      frameworkSupport: sinon.stub().returns([]),
      dependencies: () => []
    }

    npmDirInstance = {
      clean: sinon.stub().returns(Promise.resolve())
    };

    npmDirConstructor = sinon.stub().returns(npmDirInstance);

    removeFiles = sinon.stub().returns(Promise.resolve());

    frameworkSupport = {
      bootstrap: sinon.stub().returns(frameworkSupport)
    };

    index = proxyquire('../../../../src/question/client', {
      '../../npm/npm-dir': {
        default: npmDirConstructor
      },
      '../../file-helper': {
        removeFiles: removeFiles
      },
      '../../framework-support': {
        default: frameworkSupport
      }
    });
  });

  describe('BuildOpts', () => {

    let BuildOpts;

    beforeEach(() => {
      BuildOpts = index.BuildOpts;
    });

    it('builds with default pieBranch', () => {
      expect(BuildOpts.build().pieBranch).to.eql('develop');
    });

    it('builds with default bundleName', () => {
      expect(BuildOpts.build().bundleName).to.eql('pie.js');
    });
  });

  describe('ClientBuildable', () => {

    let ClientBuildable, buildable;

    beforeEach(() => {
      ClientBuildable = index.ClientBuildable;
    });

    describe('constructor', () => {
      beforeEach(() => {
        buildable = new ClientBuildable({ dir: 'dir' }, [], {}, emptyApp);
      });

      it('calls new NpmDir', () => {
        sinon.assert.calledWith(npmDirConstructor, 'dir');
      });

    });

    describe('clean', () => {

      beforeEach((done) => {
        buildable = new ClientBuildable({ dir: 'dir' }, [], { bundleName: 'pie.js' }, emptyApp);
        buildable.clean()
          .then(() => done())
          .catch(done);
      });

      it('calls npmDir.clean', () => {
        sinon.assert.called(npmDirInstance.clean);
      });

      it('calls removeFile', () => {
        sinon.assert.calledWith(removeFiles, 'dir', ['pie.js', 'pie.js.map', 'entry.js']);
      });
    });

    describe('pack', () => {
      let buildable;
      beforeEach(() => {
        buildable = new ClientBuildable({ dir: 'dir' }, [], { bundleName: 'pie.js' }, emptyApp);
        buildable.prepareWebpackConfig = sinon.stub().returns(Promise.resolve());
        buildable.bundle = sinon.stub().returns(Promise.resolve());
      });

      let pack = (clean) => {
        return (done) => {
          buildable.pack(clean)
            .then(() => {
              sinon.assert.calledWith(buildable.prepareWebpackConfig, clean);
              sinon.assert.called(buildable.bundle);
              done();
            })
            .catch(done);
        }
      }

      it('calls the steps with clean=true', pack(true));
      it('calls the steps with clean=false', pack(false));
    });

    describe('prepareWebpackConfig', () => {
      let buildable;
      beforeEach(() => {
        buildable = new ClientBuildable({ dir: 'dir' }, [], { bundleName: 'pie.js' }, emptyApp);
        buildable.clean = sinon.stub().returns(Promise.resolve());
        buildable._install = sinon.stub().returns(Promise.resolve());
        buildable.writeEntryJs = sinon.stub().returns(Promise.resolve());
        buildable.webpackConfig = sinon.stub().returns(Promise.resolve());
      });

      let prepareWebpackConfig = (clean) => {
        return (done) => {
          buildable.prepareWebpackConfig(clean)
            .then(() => {
              sinon.assert.called(buildable._install);
              sinon.assert.called(buildable.writeEntryJs);
              sinon.assert.called(buildable.webpackConfig);
              sinon.assert[clean ? 'called' : 'notCalled'](buildable.clean);
              done();
            })
            .catch(done);
        }
      }

      it('calls steps when clean=true', prepareWebpackConfig(true));
      it('calls steps when clean=false', prepareWebpackConfig(false));

    });


    describe('_buildFrrameworkConfig', () => {
      let buildable;
      beforeEach((done) => {
        let config = {
          dir: 'dir',
          piePackages: [
            {
              name: 'pie-one',
              dependencies: {
                a: '1.0.0',
                b: '1.0.0'
              }
            }
          ],
          readPackages: sinon.spy(keys => {
            return _.map(keys, k => {
              let o = { dependencies: {}}
              o.dependencies[k] = '1.0.0';
              return o;
            });
          })
        };

        emptyApp.dependencies = sinon.stub().returns({appDependency: '1.0.0'});

        buildable = new ClientBuildable(config, [], { bundleName: 'pie.js', pieBranch: 'develop' }, emptyApp);
        buildable.frameworkSupport = {
          buildConfigFromPieDependencies: sinon.stub().returns({ _mockSupportConfig: true })
        }

        buildable._buildFrameworkConfig()
          .then(() => {
            done();
          })
          .catch(done);
      });

      it('calls buildConfigFromPieDependencies', () => {
        sinon.assert.calledWith(buildable.frameworkSupport.buildConfigFromPieDependencies, { a: ['1.0.0'],  b: ['1.0.0'], appDependency: ['1.0.0'] });
      });

      it('sets _supportConfig', () => {
        expect(buildable._supportConfig).to.eql({ _mockSupportConfig: true });
      });

      it('call app.dependencies with pieBranch', () => {
        sinon.assert.calledWith(emptyApp.dependencies, 'develop');
      })
    });


    describe('webpackConfig', () => {

      let buildable, loader, config;

      beforeEach((done) => {
        loader = { test: /Iamaloader/ };

        buildable = new ClientBuildable({ dir: 'dir' }, [], { bundleName: 'pie.js' }, emptyApp);
        buildable._supportConfig = {
          webpackLoaders: sinon.stub().returns([loader])
        }
        buildable.webpackConfig()
          .then((c) => {
            config = c;
            done();
          })
          .catch(done);
      });

      it('calls webpackLoaders', () => {
        sinon.assert.called(buildable._supportConfig.webpackLoaders);
      });

      it('returns config.context', () => {
        expect(config.context).to.eql('dir');
      });

      it('returns config.entry', () => {
        expect(config.entry).to.eql('dir/entry.js');
      });

      it('returns config.output.filename', () => {
        expect(config.output.filename).to.eql('pie.js');
      });

      it('returns config.output.path', () => {
        expect(config.output.path).to.eql('dir');
      });

      it('returns config.module.loaders[1]', () => {
        expect(config.module.loaders[0]).to.eql(loader);
      });
    });
  });

});