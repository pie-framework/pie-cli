import { expect } from 'chai';
import { stub, assert } from 'sinon';
import proxyquire from 'proxyquire';

describe('Question', () => {
  let Question, controllers, client, questionConfig, app, fs;

  beforeEach(() => {

    app = {
      frameworkSupport: stub()
    }

    client = new function () {
      this.BuildOpts = {
        build: stub().returns({ client: true })
      }

      this.instance = {
        clean: stub().returns(Promise.resolve())
      }

      this.ClientBuildable = stub().returns(this.instance);
    }

    controllers = new function () {
      this.BuildOpts = {
        build: stub().returns({ controllers: true })
      }

      this.instance = {
        clean: stub().returns(Promise.resolve()),
        controllersDir: 'controllersDir'
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
      removeSync: stub()
    }
    let proxied = proxyquire('../../../src/question', {
      'fs-extra': fs,
      './client': client,
      './controllers': controllers,
      './question-config': questionConfig
    });

    Question = proxied.default;
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
    beforeEach(() => {
      new Question('dir', Question.buildOpts({}), [], app);
    });

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
    let q;

    beforeEach((done) => {
      q = new Question('dir', Question.buildOpts({}), [], app);

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

    it('calls removSync', () => {
      assert.calledWith(fs.removeSync, 'controllersDir');
    });

  })
});