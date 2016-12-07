import { expect } from 'chai';
import { stub, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';


describe('Question', () => {
  let q, Question, CleanMode, controllers, client, configConstructor, FileNames, app, fs, fileHelper;

  beforeEach(() => {

    app = {
      frameworkSupport: stub()
    }

    client = new function () {
      this.BuildOpts = {
        build: stub().returns({ client: true })
      }

      this.webpackConfig = {
        output: {
          filename: 'pie.js'
        }
      }

      this.instance = {
        buildInfo: {
          dir: 'client-dir',
          buildOnly: ['node_modules'],
          output: ['pie.js']
        },
        pack: stub().returns(Promise.resolve({ clientResult: true })),
        prepareWebpackConfig: stub().returns(Promise.resolve(this.webpackConfig))
      }

      this.ClientBuildable = stub().returns(this.instance);
    }

    controllers = new function () {
      this.BuildOpts = {
        build: stub().returns({ controllers: true })
      }

      this.webpackConfig = {
        output: {
          filename: 'controllers.js'
        }
      }

      this.instance = {
        buildInfo: {
          dir: 'controllers-dir',
          buildOnly: ['controllers'],
          output: ['controllers.js']
        },
        pack: stub().returns(Promise.resolve({ controllersResult: true })),
        controllersDir: 'controllersDir',
        prepareWebpackConfig: stub().returns(Promise.resolve(this.webpackConfig))
      }

      this.ControllersBuildable = stub().returns(this.instance);
    }


    fs = {
      removeSync: stub().returns(Promise.resolve())
    }

    fileHelper = {
      removeFilePaths: spy(function (paths) {
        return Promise.resolve(paths);
      })
    }

    configConstructor = stub().returns({});

    let proxied = proxyquire('../../../lib/question', {
      'fs-extra': fs,
      './client': client,
      './controllers': controllers,
      './config': {
        JsonConfig: configConstructor,
      },
      '../file-helper': fileHelper
    });


    FileNames = require('../../../lib/question/config').FileNames;

    Question = proxied.default;
    CleanMode = proxied.CleanMode;
    q = new Question('dir', Question.buildOpts({}), [], app);
  });

  describe('buildOpts', () => {

    let opts;

    beforeEach(() => {
      opts = Question.buildOpts({});
    });

    it('builds the client opts', () => {
      expect(opts.client).to.eql(client.BuildOpts.build())
    });

    it('builds the controller opts', () => {
      expect(opts.controllers).to.eql(controllers.BuildOpts.build())
    });

    it('builds the questionConfig filenames', () => {
      expect(opts.question).to.eql(require('../../../lib/question/config').FileNames.build());
    });
  });

  describe('constructor', () => {

    it('calls new QuestionConfig', () => {
      assert.calledWith(configConstructor, 'dir', FileNames.build());
    });

    it('calls new ClientBuildable', () => {
      assert.calledWith(client.ClientBuildable, {}, [], client.BuildOpts.build());
    });

    it('calls new ControllersBuildable', () => {
      assert.calledWith(controllers.ControllersBuildable, {}, controllers.BuildOpts.build());
    });
  });

  describe('clean', () => {

    let assertClean = (mode, fn) => {
      return (done) => {
        q.clean(mode)
          .then((paths) => {
            fn(paths);
            done()
          })
          .catch(done);
      }
    }

    it('removes BUILD_ONLY build assets', assertClean(/*CleanMode.BUILD_ONLY*/ 0, (paths) => {
      expect(paths).to.eql([
        'client-dir/node_modules',
        'controllers-dir/controllers'
      ]);
    }));

    it('removes All build assets', assertClean(/*CleanMode.ALL*/ 1, (paths) => {
      expect(paths).to.eql([
        'client-dir/node_modules',
        'client-dir/pie.js',
        'controllers-dir/controllers',
        'controllers-dir/controllers.js'
      ]);
    }));
  });

  describe('pack', () => {
    let result;

    let checks = (cleanParam) => {

      describe('with clean=' + cleanParam, () => {
        beforeEach((done) => {
          q.clean = stub().returns(Promise.resolve([]));
          q.pack(cleanParam)
            .then((r) => {
              result = r;
              done();
            })
            .catch(done);
        });

        it(`calls client.pack()`, () => {
          assert.called(client.instance.pack);
        });

        it(`calls controllers.pack()`, () => {
          assert.called(controllers.instance.pack);
        });

        if (cleanParam) {
          it(`calls this.clean`, () => {
            assert.calledWith(q.clean, 1)
          });
        } else {
          it(`does not call this.clean`, () => {
            assert.notCalled(q.clean);
          });
        }

        it(`gets the result`, () => {
          expect(result).to.eql({ client: { clientResult: true }, controllers: { controllersResult: true } });
        });

      });
    }

    checks(true);
    checks(false);
  });

  describe('prepareWebpackConfigs', () => {
    let result;

    let checks = (cleanParam) => {

      describe('with clean=' + cleanParam, () => {
        beforeEach((done) => {
          q.clean = stub().returns(Promise.resolve([]));

          q.prepareWebpackConfigs(cleanParam)
            .then((r) => {
              result = r;
              done();
            })
            .catch(done);
        });

        it(`calls client.prepareWebpackConfig()`, () => {
          assert.called(client.instance.prepareWebpackConfig);
        });

        it(`calls controllers.prepareWebpackConfig()`, () => {
          assert.called(controllers.instance.prepareWebpackConfig);
        });

        it(`returns the results`, () => {
          expect(result).to.eql({
            client: client.webpackConfig,
            controllers: controllers.webpackConfig
          });
        });

        if (cleanParam) {
          it(`calls this.clean`, () => {
            assert.calledWith(q.clean, 1)
          });
        } else {
          it(`does not call this.clean`, () => {
            assert.notCalled(q.clean);
          });
        }
      });
    }

    checks(false);
    checks(true);

  });
});