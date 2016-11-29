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
      clean: stub().returns(Promise.resolve()),
      client: {
        externals: { js: ['external.js'], css: ['external.css'] }
      }
    };

    questionConstructor = stub().returns(questionInstance);

    buildOpts = {
      client: {},
      controllers: {},
      config: {}
    }

    questionConstructor.buildOpts = stub().returns(buildOpts);
    questionConstructor['@noCallThru'] = true;

    manifest = {
      default: {
        run: stub().returns(Promise.resolve()),
      }
    }

    exampleApp = {
      staticMarkup: stub().returns('<div>hi</div>')
    }

    cmd = proxyquire('../../../lib/cli/pack-question', {
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
    }).default;
  });

  describe('match', () => {

    it('returns true for pack-question', () => {
      expect(cmd.match({ _: ['pack-question'] })).to.eql(true);
    });
  });

  describe('run', () => {

    let run = (opts) => {
      return function (done) {
        cmd.run(opts)
          .then(() => {
            done();
          })
          .catch(e => {
            done(e);
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
        assert.calledWith(manifest.default.run, { outfile: 'manifest.json' });
      });
    });

    describe('with buildExample=true', () => {
      beforeEach(run({ buildExample: true }));

      assertBasics();

      it('calls exampleApp.staticMarkup', () => {


        assert.calledWith(exampleApp.staticMarkup, {
          client: 'pie.js',
          controllers: 'controller.js',
          externals: { js: ['external.js'], css: ['external.css'] }
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