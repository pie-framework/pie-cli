import { expect } from 'chai';
import { stub, assert } from 'sinon';
import proxyquire from 'proxyquire';

describe('Question', () => {
  let q, Question, controllers, client, questionConfig, app, fs;

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
        clean: stub().returns(Promise.resolve()),
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
        clean: stub().returns(Promise.resolve()),
        pack: stub().returns(Promise.resolve({ controllersResult: true })),
        controllersDir: 'controllersDir',
        prepareWebpackConfig: stub().returns(Promise.resolve(this.webpackConfig))
      }

      this.ControllersBuildable = stub().returns(this.instance);
    }


    questionConfig = new function () {
      this.BuildOpts = {
        build: stub().returns({ questionConfig: true })
      };
      this.instance = {};

      this.QuestionConfig = stub().returns(this.instance);
    };

    fs = {
      removeSync: stub().returns(Promise.resolve())
    }

    let proxied = proxyquire('../../../src/question', {
      'fs-extra': fs,
      './client': client,
      './controllers': controllers,
      './question-config': questionConfig
    });

    Question = proxied.default;
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

    it('builds the questionConfig opts', () => {
      expect(opts.question).to.eql(questionConfig.BuildOpts.build())
    });
  });

  describe('constructor', () => {

    it('calls new QuestionConfig', () => {
      assert.calledWith(questionConfig.QuestionConfig, 'dir', questionConfig.BuildOpts.build());
    });

    it('calls new ClientBuildable', () => {
      assert.calledWith(client.ClientBuildable, questionConfig.instance, [], client.BuildOpts.build());
    });

    it('calls new ControllersBuildable', () => {
      assert.calledWith(controllers.ControllersBuildable, questionConfig.instance, controllers.BuildOpts.build());
    });
  });

  describe('clean', () => {

    beforeEach((done) => {
      q.clean()
        .then(() => done())
        .catch(done);
    });

    it('calls client.clean', () => {
      assert.called(client.instance.clean);
    });

    it('calls controllers.clean', () => {
      assert.called(controllers.instance.clean);
    });

    it('calls removeSync on controllersDir', () => {
      assert.calledWith(fs.removeSync, 'controllersDir');
    });

    it('calls removeSync on example.html', () => {
      assert.calledWith(fs.removeSync, 'dir/example.html');
    });

  });

  describe('pack', () => {
    let result;

    let checks = (cleanParam) => {

      beforeEach((done) => {
        q.pack(cleanParam)
          .then((r) => {
            result = r;
            done();
          })
          .catch(done);
      });

      it(`calls client.pack(${cleanParam})`, () => {
        assert.calledWith(client.instance.pack, cleanParam);
      });

      it(`calls controllers.pack(${cleanParam})`, () => {
        assert.calledWith(controllers.instance.pack, cleanParam);
      });

      it(`returns the results when called with ${cleanParam}`, () => {
        expect(result).to.eql({ client: { clientResult: true }, controllers: { controllersResult: true } });
      });
    }

    checks(false);
    checks(true);
  });

  describe('prepareWebpackConfigs', () => {
    let result;

    let checks = (cleanParam) => {

      beforeEach((done) => {
        q.prepareWebpackConfigs(cleanParam)
          .then((r) => {
            result = r;
            done();
          })
          .catch(done);
      });

      it(`calls client.prepareWebpackConfig(${cleanParam})`, () => {
        assert.calledWith(client.instance.prepareWebpackConfig, cleanParam);
      });

      it(`calls controllers.prepareWebpackConfig(${cleanParam})`, () => {
        assert.calledWith(controllers.instance.prepareWebpackConfig, cleanParam);
      });

      it(`returns the results with ${cleanParam}`, () => {
        expect(result).to.eql({
          client: client.webpackConfig,
          controllers: controllers.webpackConfig
        });
      });
    }

    checks(false);
    checks(true);

  });
});