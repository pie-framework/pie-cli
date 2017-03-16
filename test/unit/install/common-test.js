import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('common', () => {

  let mod, deps;

  beforeEach(() => {

    deps = {
      'fs-extra': {
        existsSync: stub().returns(true),
        readJson: stub().returns({})
      }
    }

    mod = proxyquire('../../../lib/install/common', deps);
  });

  describe('pieToTarget', () => {

    describe('no error', () => {
      beforeEach(() => {
        mod.getPkgName = stub().returns(Promise.resolve('pie-target'));
      });

      it('resolves the target', () => {
        return mod.pieToTarget({ key: 'pie' }, d => d)
          .then(t => {
            expect(t).to.eql({ pie: 'pie', target: 'pie-target' });
          });
      });
    });

    describe('with error', () => {
      beforeEach(() => {
        mod.getPkgName = stub().returns(Promise.reject(new Error('e')));
      });

      it('resolves null if not required', () => {
        return mod.pieToTarget({ key: 'pie' }, d => d, false)
          .then(t => expect(t).to.be.null);
      });

      it('rejects if required', () => {
        return mod.pieToTarget({ key: 'pie' }, d => d)
          .catch(e => expect(e).to.be.Error);
      });
    })
  });


  describe('toKeyValue', () => {

    it('returns key values', () => {
      let acc = {};
      mod.toKeyValue([{ pie: 'pie', target: 'pie-target' }], d => d.key, acc, { key: 'pie' })
      expect(acc).to.eql({ 'pie-target': 'pie' });
    });
  });

  describe('getPkgName', () => {
    it('resolves the package name', () => {
      deps['fs-extra'].existsSync.returns(true);
      deps['fs-extra'].readJson.yields(null, { name: 'package-name' });
      return mod.getPkgName('dir')
        .then(n => expect(n).to.eql('package-name'));
    });

    it('rejects if exists is false', () => {
      deps['fs-extra'].existsSync.returns(false);
      return mod.getPkgName('dir')
        .catch(e => expect(e).to.be.Error);
    });

    it('rejects if readJson fails', () => {
      deps['fs-extra'].existsSync.returns(true);
      deps['fs-extra'].readJson.yields(new Error('e'));
      return mod.getPkgName('dir')
        .catch(e => expect(e).to.Error);

    });
  });
});