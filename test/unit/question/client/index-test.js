import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
describe('client', () => {
  let index, npmDirConstructor, npmDirInstance, entryConstructor, entryInstance, removeFiles, frameworkSupport;

  beforeEach(() => {
    npmDirInstance = {
      clean: sinon.stub().returns(Promise.resolve())
    };

    npmDirConstructor = sinon.stub().returns(npmDirInstance);

    entryInstance = {
      clean: sinon.stub().returns(Promise.resolve()),
      name: 'entry.js'
    }

    entryConstructor = sinon.stub().returns(entryInstance);

    removeFiles = sinon.stub().returns(Promise.resolve());

    frameworkSupport = {
      bootstrap: sinon.stub().returns(frameworkSupport)
    };

    index = proxyquire('../../../../src/question/client', {
      '../../npm/npm-dir': {
        default: npmDirConstructor
      },
      './entry': {
        default: entryConstructor
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
        buildable = new ClientBuildable({ dir: 'dir' }, [], {});
      });

      it('calls new NpmDir', () => {
        sinon.assert.calledWith(npmDirConstructor, 'dir');
      });

      it('calls new Entry', () => {
        sinon.assert.calledWith(entryConstructor, 'dir');
      });
    });

    describe('clean', () => {

      beforeEach((done) => {
        buildable = new ClientBuildable({ dir: 'dir' }, [], { bundleName: 'pie.js' });
        buildable.clean()
          .then(() => done())
          .catch(done);
      });

      it('calls npmDir.clean', () => {
        sinon.assert.called(npmDirInstance.clean);
      });

      it('calls entry.clean', () => {
        sinon.assert.called(entryInstance.clean);
      });

      it('calls removeFile', () => {
        sinon.assert.calledWith(removeFiles, 'dir', ['pie.js', 'pie.js.map']);
      });
    });

    describe('pack', () => {
      let buildable;
      beforeEach(() => {
        buildable = new ClientBuildable({ dir: 'dir' }, [], { bundleName: 'pie.js' });
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
        buildable = new ClientBuildable({ dir: 'dir' }, [], { bundleName: 'pie.js' });
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
          readPackages: sinon.stub().returns([{ dependencies: { a: '2.0.0' } }])
        };

        buildable = new ClientBuildable(config, [], { bundleName: 'pie.js' });
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
        sinon.assert.calledWith(buildable.frameworkSupport.buildConfigFromPieDependencies, { a: ['1.0.0', '2.0.0'], b: ['1.0.0'] });
      });

      it('sets _supportConfig', () => {
        expect(buildable._supportConfig).to.eql({ _mockSupportConfig: true });
      });
    });


    describe('webpackConfig', () => {

      let buildable, loader, config;

      beforeEach((done) => {
        loader = { test: /Iamaloader/ };

        buildable = new ClientBuildable({ dir: 'dir' }, [], { bundleName: 'pie.js' });
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
        expect(config.module.loaders[1]).to.eql(loader);
      });
    });
  });

});