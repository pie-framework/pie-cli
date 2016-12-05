import proxyquire from 'proxyquire';
import { assert, stub } from 'sinon';

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


  it('does not add git-sha if .git dir doesnt exist', () => {
    cmd.run(log);
    assert.calledWith(log, 'version: 1.0.0');
  });

  describe('if .git dir exists', () => {

    beforeEach(() => {
      gitExists = true;
      cmd = getCmd();
    });

    it('does add git-sha if .git dir exists', () => {
      cmd.run(log);
      assert.calledWith(log, 'version: 1.0.0, git-sha: HASH');
    });

  });
});