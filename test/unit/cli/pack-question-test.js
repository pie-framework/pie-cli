import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { assert, stub, spy } from 'sinon';

describe('pack-question', () => {

  let cmd, questionConstructor, questionInstance, buildOpts, fsExtra, path;

  beforeEach(() => {

    fsExtra = {
      removeSync: stub()
    }

    path = {
      resolve: spy(function(i){
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

    cmd = proxyquire('../../../src/cli/pack-question', {
      '../question': {
        default: questionConstructor
      },
      'fs-extra' : fsExtra,
      'path': path
    });
  });

  describe('match', () => {

    it('returns true for pack-question', () => {
      expect(cmd.match({ _: ['pack-question'] })).to.eql(true);
    });
  });

  describe('run', () => {

    describe('with keepBuildAssets=false', () => {
      beforeEach((done) => {
      cmd.run({dir: 'dir', buildExample: false})
        .then(() => {
         done();
        })
        .catch(done);
      });

      it('calls pack', () => {
        assert.calledWith(questionInstance.pack, false);
      });
      
      it('calls clean', () => {
        assert.called(questionInstance.clean);
      });
      
      it('calls removeSync if buildExample=false', () => {
        assert.calledWith(fsExtra.removeSync, 'dir/example.html');
      });
    });
  });
});