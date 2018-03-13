import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('session', () => {

  let mod, deps, FileNames, filenamesInstance;

  beforeEach(() => {
    filenamesInstance = {
      resolveSession: stub().returns('session.json')
    };

    FileNames = {
      build: stub().returns(filenamesInstance)
    };

    deps = {
      '../config': {
        FileNames: FileNames
      },
      '../config/types': {
        fromPath: stub().returns([])
      },
      'fs-extra': {
        existsSync: stub().returns(false)
      }
    };

    mod = proxyquire('../../../../lib/question/session', deps);

  })

  describe('build', () => {

    beforeEach(() => {
      mod.Session.build('dir', { args: true });
    });

    it('calls Filenames.build', () => {
      assert.calledWith(FileNames.build, { args: true });
    });

    it('calls resolveSession', () => {
      assert.calledWith(filenamesInstance.resolveSession, 'dir');
    });

    it('calls existsSync', () => {
      assert.calledWith(filenamesInstance.resolveSession, 'dir');
    });
  });

  describe('reload', () => {
    let s;
    beforeEach(() => {
      s = new mod.Session('dir/session.json');
      deps['fs-extra'].existsSync.returns(true);
      s.reload();
    });

    it('calls fromPath', () => {
      assert.calledWith(deps['../config/types'].fromPath, 'dir/session.json');
    });
  });
});