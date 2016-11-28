import proxyquire from 'proxyquire';
import { assert, stub } from 'sinon';
import { expect } from 'chai';

describe('manifest', () => {
  let cmd, make, manifestResult, cmdResult, fsExtra;

  beforeEach(() => {
    process.cwd = stub().returns('dir');

    fsExtra = {
      writeJsonSync: stub()
    }

    manifestResult = { hash: 'XXX', src: 'src', dependencies: {} };

    make = stub().returns(manifestResult);

    cmd = proxyquire('../../../lib/cli/manifest', {
      'fs-extra': fsExtra,
      '../question/manifest': {
        make: make
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
        assert.calledWith(make, 'dir');
      });

      it('gets the result', () => expect(cmdResult).to.eql(JSON.stringify(manifestResult)));

    });

    describe('with outfile', () => {
      beforeEach(run({ outfile: 'manifest.json' }));

      it('calls writeJsonSync', () => {
        assert.calledWith(fsExtra.writeJsonSync, 'manifest.json', manifestResult);
      });

      it('gets the result', () => expect(cmdResult).to.eql(JSON.stringify(manifestResult)));
    });

    describe('with dir', () => {

      beforeEach(run({ dir: 'other-dir' }));

      it('calls makeManifest with passed in dir opt', () => {
        assert.calledWith(make, 'other-dir');
      });
    });

  });
});