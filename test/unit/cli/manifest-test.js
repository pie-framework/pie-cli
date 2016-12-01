import proxyquire from 'proxyquire';
import { assert, stub } from 'sinon';
import { expect } from 'chai';

describe('manifest', () => {
  let cmd, make, manifestResult, cmdResult, fsExtra, config, configConstructor;

  beforeEach(() => {
    process.cwd = stub().returns('dir');

    fsExtra = {
      writeJsonSync: stub()
    }

    config = {
      manifest: {
        hash: 'xxxxxx'
      }
    };

    configConstructor = stub().returns(config);

    cmd = proxyquire('../../../lib/cli/manifest', {
      'fs-extra': fsExtra,
      '../question/config': {
        JsonConfig: configConstructor
      }
    }).default;
  });

  let run = (args) => {
    args = args || {};
    return (done) => {
      cmd.run(args)
        .then((m) => {
          cmdResult = m;
          done()
        })
        .catch(done);
    }
  }

  describe('run', () => {
    describe('with no opts', () => {

      beforeEach(run());

      it('calls makeManifest with default dir', () => {
        assert.calledWith(configConstructor, 'dir');
      });

      it('gets the result', () => expect(cmdResult).to.eql(JSON.stringify(config.manifest)));

    });

    describe('with outfile', () => {
      beforeEach(run({ outfile: 'manifest.json' }));

      it('calls writeJsonSync', () => {
        assert.calledWith(fsExtra.writeJsonSync, 'manifest.json', config.manifest);
      });

      it('gets the result', () => expect(cmdResult).to.eql(JSON.stringify(config.manifest)));
    });

    describe('with dir', () => {

      beforeEach(run({ dir: 'other-dir' }));

      it('calls makeManifest with passed in dir opt', () => {
        assert.calledWith(configConstructor, 'other-dir');
      });
    });

  });
});