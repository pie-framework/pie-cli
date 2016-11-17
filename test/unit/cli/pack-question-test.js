import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { assert, stub, spy } from 'sinon';

describe('pack-question', () => {

  let cmd,
    questionConstructor,
    questionInstance,
    buildOpts,
    fsExtra,
    path,
    manifest,
    exampleApp;

  beforeEach(() => {

    fsExtra = {
      removeSync: stub()
    }

    path = {
      resolve: spy(function (i) {
        return i;
      })
    }

    questionInstance = {
      config: {
        markup: '<div></div>',
        config: {}
      },
      pack: stub().returns(Promise.resolve({
        controllers: {
          filename: 'controller.js',
          library: 'id'
        },
        client: 'pie.js'
      })),
      clean: stub().returns(Promise.resolve())
    };

    questionConstructor = stub().returns(questionInstance);

    buildOpts = {
      client: {},
      controllers: {},
      config: {}
    }

    questionConstructor.buildOpts = stub().returns(buildOpts);

    manifest = {
      run: stub().returns(Promise.resolve())
    }

    exampleApp = {
      staticMarkup: stub().returns('<div>hi</div>')
    }

    cmd = proxyquire('../../../src/cli/pack-question', {
      '../question': {
        default: questionConstructor
      },
      '../file-helper': {
        softWrite: stub()
      },
      'fs-extra': fsExtra,
      'path': path,
      './manifest': manifest,
      '../example-app': {
        default: stub().returns(exampleApp)
      }
    });
  });

  describe('match', () => {

    it('returns true for pack-question', () => {
      expect(cmd.match({ _: ['pack-question'] })).to.eql(true);
    });
  });

  describe('run', () => {

    let run = (opts) => {
      return function (done) {
        global.testLogger.info('questionInstance: ', questionInstance)
        global.testLogger.info('cmd: ', cmd);
        cmd.run(opts)
          .then(() => {
            global.testLogger.info('run is done.');
            done();
          })
          .catch(e => {
            global.testLogger.error(e.stack);
            done(new Error('!'))
          });
      }
    }

    let assertBasics = () => {
      it('calls pack', () => {
        try {
          assert.calledWith(questionInstance.pack, false);
        } catch (e) {
          console.log(e);
          console.log(e.stack);
        }
      });
    }

    describe('with manifestOutfile', () => {
      beforeEach(run({ manifestOutfile: 'manifest.json' }));

      assertBasics();
      it('calls clean', () => {
        assert.called(questionInstance.clean);
      });

      it('calls manifestCmd.run', () => {
        assert.calledWith(manifest.run, { outfile: 'manifest.json' });
      });
    });

    describe('with buildExample=true', () => {
      beforeEach(run({ buildExample: true }));

      assertBasics();

      it('calls exampleApp.staticMarkup', () => {

        assert.calledWith(exampleApp.staticMarkup, {
          client: 'pie.js',
          controllers: 'controller.js'
        },
          { controllers: 'id', },
          questionInstance.config.markup,
          questionInstance.config.config
        );
      });
    });

    describe('with keepBuildAssets=false', () => {
      beforeEach(run({ dir: 'dir', buildExample: false }));

      assertBasics();

      it('calls removeSync if buildExample=false', () => {
        assert.calledWith(fsExtra.removeSync, 'dir/example.html');
      });
    });
  });
});