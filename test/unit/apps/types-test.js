import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('ServeOpts', () => {
  let mod, deps;

  beforeEach(() => {
    deps = {

    }
    mod = proxyquire('../../../lib/apps/types', deps);
  });

  describe('build', () => {

    describe('defaults', () => {
      let opts;
      beforeEach(() => {
        opts = mod.ServeOpts.build();
      });

      it('sets dir', () => expect(opts.dir).to.eql(process.cwd()));
      it('sets port', () => expect(opts.port).to.eql(4000));
      it('sets forceInstall', () => expect(opts.forceInstall).to.eql(false));
      it('sets sourceMaps', () => expect(opts.sourceMaps).to.eql(true));
    });

    describe('non defaults', () => {
      let opts;
      beforeEach(() => {
        opts = mod.ServeOpts.build({
          dir: 'dir',
          port: 4001,
          forceInstall: true,
          sourceMaps: false
        });
      });

      it('sets dir', () => expect(opts.dir).to.eql('dir'));
      it('sets port', () => expect(opts.port).to.eql(4001));
      it('sets forceInstall', () => expect(opts.forceInstall).to.eql(true));
      it('sets sourceMaps', () => expect(opts.sourceMaps).to.eql(false));
    });
  });
});