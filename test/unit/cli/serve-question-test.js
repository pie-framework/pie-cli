import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { spy, stub, assert, match } from 'sinon';

let noCallThruStub = (returnValue) => {
  let s = stub().returns(returnValue);
  s['@noCallThru'] = true;
  return s;
}

describe('serve-question', () => {
  let cmd, proxy, question, questionConstructor, exampleApp, exampleAppConstructor, webpack, watchmaker;
  
  beforeEach(() => {

    exampleApp = new function () {
      this._server = {
        on: stub(),
        listen: stub()
      };
      this.server = stub().returns(this._server);
    }

    exampleAppConstructor = noCallThruStub(exampleApp); 

    question = {
      controllers: {
        uid: 'uid'
      },
      config: {
        readMarkup: stub(),
        readConfig: stub()
      },
      prepareWebpackConfigs: stub().returns(Promise.resolve({
        client: {clientConfig: true},
        controllers: {controllersConfig: true}
      })),
      externals: {
        js: ['external.js'],
        css: ['external.css']
      }
    }

    questionConstructor = noCallThruStub(question);
    
    questionConstructor.buildOpts = stub().returns({
      controllers: {
        filename: 'controllers.js'
      },
      client: {
        bundleName: 'pie.js'
      } 
    });

    webpack = spy(function(config) {
      return {
        stubCompiler: true,
        config: config
      }
    });

    watchmaker = {
      init: stub()
    };

    proxy = {
      '../question':  questionConstructor,
      'webpack' : webpack,
      '../watch/watchmaker': watchmaker, 
      '../example-app': exampleAppConstructor
    }
    cmd = proxyquire('../../../src/cli/serve-question', proxy);
  });

  describe('ServeQuestionOpts', () => {

    let ServeQuestionOpts;

    beforeEach(() => {
      ServeQuestionOpts = cmd.ServeQuestionOpts;
    });

    it('build defaults', () => {
      expect(ServeQuestionOpts.build()).to.eql({
        dir: process.cwd(),
        clean: false,
        port: 4000
      });
    });

    describe('custom opts', () => {
      let opts;

      before(()=> {
        opts = ServeQuestionOpts.build({
          port: 3000,
          clean: true,
          dir: 'dir'
        })
      });

      it('sets port to 3000', () => {
        expect(opts.port).to.eql(3000);
      });
      
      it('sets clean to true', () => {
        expect(opts.clean).to.eql(true);
      });
      
      it('sets dir to dir', () => {
        expect(opts.dir).to.eql('dir');
      });
    });
  });

  describe('run', () => {

    let result;

    beforeEach((done) => {
      cmd.run()
        .then((r) => {
          result = r;
          done();
        })
        .catch(done);
    });

    it('calls prepareWebpackConfigs', () => {
      assert.calledWith(question.prepareWebpackConfigs, false);
    });

    it('calls webpack for client', () => {
      assert.calledWith(webpack, {clientConfig: true});
    });

    it('calls webpack for controllers', () => {
      assert.calledWith(webpack, {controllersConfig: true});
    });


    it('calls app.server', () => {
      let opts = {
        paths: {
          controllers: 'controllers.js',
          client: 'pie.js',
          externals: {
            js: ['external.js'],
            css: ['external.css']
          }
        },
        ids: {
          controllers: 'uid'
        },
        markup: match.func, 
        model: match.func
      }

      assert.calledWith(exampleApp.server, 
        { 
          client: {
            stubCompiler: true, 
            config: match.object
          }, 
          controllers: {
            stubCompiler: true, 
            config: match.object
          }
        }, opts);
    });

    it('calls server.listen', () => {
      assert.calledWith(exampleApp._server.listen, 4000);
    });

    it('calls watchmaker.init', () => {
      assert.calledWith(watchmaker.init, question.config, match.func);
    });

    it('returns a message', () => {
      expect(result).to.eql('server listening on 4000');
    });
  });

});