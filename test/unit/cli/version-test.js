import { assert, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('version', () => {

  let cmd, log, gitExists;

  let getCmd = () => {
    return proxyquire('../../../lib/cli/version', {
      'fs-extra': {
        readJsonSync: stub().returns({ version: '1.0.0' }),
        existsSync: stub().returns(gitExists)
      },
      'child_process': {
        execSync: stub().returns('HASH')
      }
    }).default;
  }

  beforeEach(() => {
    log = stub();
    gitExists = false;
    process.exit = stub();
    cmd = getCmd();
  });

  describe('match', () => {

    it('returns false for empty object', () => {
      expect(cmd.match({})).not.to.be.true;
    });

    it('returns true for v ', () => {
      expect(cmd.match({ v: true })).to.be.true;
    });

    it('returns true for version ', () => {
      expect(cmd.match({ version: true })).to.be.true;
    });
  });

  describe('run', () => {
    it('does not add git-sha if .git dir doesnt exist', () => {
      cmd.run({ log: log });
      assert.calledWith(log, 'version: 1.0.0');
    });

    describe('if .git dir exists', () => {

      beforeEach(() => {
        gitExists = true;
        cmd = getCmd();
      });

      it('does add git-sha if .git dir exists', () => {
        cmd.run({ log: log });
        assert.calledWith(log, 'version: 1.0.0, git-sha: HASH');
      });

    });

  });
});