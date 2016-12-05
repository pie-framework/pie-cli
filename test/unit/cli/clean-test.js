import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { assert, stub, spy } from 'sinon';

describe('clean', () => {

  let cmd, questionConstructor, questionInstance, buildOpts, fsExtra, path;

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

    cmd = proxyquire('../../../lib/cli/clean', {
      '../question': {
        default: questionConstructor
      },
      'fs-extra': fsExtra,
      'path': path
    }).default;
  });

  describe('match', () => {

    it('returns true for clean', () => {
      expect(cmd.match({ _: ['clean'] })).to.eql(true);
    });
  });

  describe('run', () => {

    beforeEach((done) => {
      cmd.run({ dir: 'dir', buildExample: false })
        .then(() => {
          done();
        })
        .catch(done);
    });

    it('calls question.clean', () => {
      assert.called(questionInstance.clean);
    });

    it('calls removeSync on example.html', () => {
      assert.calledWith(fsExtra.removeSync, 'dir/example.html');
    });
  });
});