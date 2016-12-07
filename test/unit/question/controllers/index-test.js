import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { assert, stub, spy, match } from 'sinon';
import _ from 'lodash';
import { join } from 'path';

describe('controllers', () => {

  let proxied, Controllers, dependencyHelper, npmDir, webpackBuilder, fsExtra;

  beforeEach(() => {

    dependencyHelper = {
      dependenciesToHash: stub().returns('hash')
    };

    npmDir = {
      install: stub().returns(Promise.resolve()),
    };

    webpackBuilder = {
      build: stub().returns(Promise.resolve())
    }

    fsExtra = {
      ensureDirSync: stub(),
      existsSync: stub().returns(true),
      writeFileSync: stub()
    }

    proxied = proxyquire('../../../../lib/question/controllers', {
      '../../npm/npm-dir': {
        default: stub().returns(npmDir)
      },
      '../../npm/dependency-helper': dependencyHelper,
      '../../file-helper': {},
      '../../code-gen/webpack-builder': webpackBuilder,
      'fs-extra': fsExtra,
      'path': {
        relative: stub().returns('relative-path'),
        resolve: spy(function (p) {
          return p;
        })
      }
    });

    Controllers = proxied.ControllersBuildable;
  });

  describe('ControllersBuildable', () => {

    let buildable;

    beforeEach(() => {
      buildable = new Controllers({
        dir: 'dir', installedPies: [{
          key: 'my-pie',
          controllerDir: '../../my-pie',
        }]
      }, { filename: 'controllers.js' });
    });

    describe('get dependencies', () => {
      it('returns a dependency map', () => {
        expect(buildable.dependencies).to.eql({
          'my-pie': 'relative-path'
        });
      });
    });

    describe('prepareWebpackConfig', () => {
      beforeEach((done) => {
        buildable.writeEntryJs = stub().returns(Promise.resolve());
        buildable.webpackConfig = stub().returns(Promise.resolve());
        buildable.prepareWebpackConfig()
          .then(done.bind(null, null))
          .catch(done);
      });

      it('calls npmDir.install', () => {
        assert.called(npmDir.install);
      });

      it('calls this.writeEntryJs', () => {
        assert.called(buildable.writeEntryJs);
      });

      it('calls this.webpackConfig', () => {
        assert.called(buildable.webpackConfig);
      });
    });

    describe('pack', () => {
      let config;
      beforeEach((done) => {
        config = { config: true };
        buildable.prepareWebpackConfig = stub().returns(Promise.resolve(config));
        buildable.bundle = stub().returns(Promise.resolve());
        buildable.pack()
          .then(done.bind(null, null))
          .catch(done);
      });

      it('call this.prepareWebpackConfig', () => {
        assert.called(buildable.prepareWebpackConfig);
      });

      it('call this.bundle', () => {
        assert.calledWith(buildable.bundle, config);
      });
    });

    describe('bundle', () => {
      let result, config;

      beforeEach((done) => {
        config = {
          output: {
            path: 'path',
            filename: 'filename'
          }
        };

        buildable.bundle(config)
          .then(r => {
            result = r;
            done();
          })
          .catch(done);
      });

      it('calls this.buildWebpack', () => {
        assert.calledWith(webpackBuilder.build, config);
      });

      it('returns the result', () => {
        expect(result).to.eql({
          dir: config.output.path,
          filename: config.output.filename,
          path: join(config.output.path, config.output.filename),
          library: buildable.uid
        });
      });
    });

    describe('writeEntryJs', () => {

      beforeEach((done) => {
        fsExtra.existsSync.returns(false);
        buildable.writeEntryJs({
          a: '1.0.0'
        }).then(done.bind(null, null))
          .catch(done);
      });

      it('calls fs.existsSync', () => {
        assert.calledWith(fsExtra.existsSync, 'dir/controllers/entry.js');
      });

      it('calls fs.writeFileSync', () => {
        assert.calledWith(fsExtra.writeFileSync, 'dir/controllers/entry.js', match.string, 'utf8');
      });
    });

    describe('get uid', () => {

      beforeEach(() => {
        buildable.uid;
      });

      it('calls dependenciesToHash', () => {
        assert.calledWith(dependencyHelper.dependenciesToHash, buildable.dependencies);
      });
    });

    describe('get buildInfo', () => {

      it('returns the build info', () => {
        expect(buildable.buildInfo).to.eql({
          dir: 'dir',
          buildOnly: ['controllers'],
          output: ['controllers.js']
        });
      });
    });

    describe('webpackConfig', () => {

      let result;

      beforeEach((done) => {
        buildable.webpackConfig()
          .then((r) => {
            result = r;
            done();
          })
          .catch(done);
      });

      it('returns a config', () => {
        expect(result).to.eql({
          context: buildable.controllersDir,
          entry: './entry.js',
          output: {
            path: buildable.config.dir,
            filename: buildable.opts.filename,
            library: buildable.uid,
            libraryTarget: 'umd'
          },
          resolve: {
            root: 'dir/controllers/node_modules'
          },
          resolveLoader: {
            root: 'dir/controllers/node_modules'
          }
        })
      });
    });
  });
})