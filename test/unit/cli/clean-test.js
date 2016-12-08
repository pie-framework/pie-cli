import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { assert, stub, spy } from 'sinon';
import { loadStubApp, runCmd } from './helper';

describe('clean', () => {

  let cmd, app, stubbed;

  beforeEach(() => {

    app = {
      clean: stub().returns('done')
    }
    stubbed = loadStubApp('../../../lib/cli/clean', app);
    cmd = stubbed.module.default;
  });

  describe('match', () => {

    it('returns true for clean', () => {
      expect(cmd.match({ _: ['clean'] })).to.eql(true);
    });
  });

  describe('run', () => {

    beforeEach((done) => runCmd(cmd, { dir: 'dir' }, done));

    it('calls loadApp', () => {
      assert.calledWith(stubbed.loadApp, { dir: 'dir' });
    });

    it('calls app.clean', () => {
      assert.called(app.clean);
    });
  });
});