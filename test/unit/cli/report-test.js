import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('report', () => {

  let mod, deps, oraInstance, stream;

  beforeEach(() => {

    oraInstance = {};
    oraInstance.start = stub().returns(oraInstance);
    oraInstance.succeed = stub().returns(oraInstance);
    oraInstance.fail = stub().returns(oraInstance);

    stream = {
      write: stub()
    }

    deps = {
      'ora': stub().returns(oraInstance)
    };

    mod = proxyquire('../../../lib/cli/report', deps);
  });

  describe('indeterminate', () => {

    describe('successful', () => {
      beforeEach(() => {
        let r = new mod.Report(stream);
        return r.indeterminate('test', new Promise(r => setTimeout(r, 10)))
      });

      it('calls ora.start', () => {
        assert.called(oraInstance.start);
      });

      it('calls ora.succeed', () => {
        assert.calledWith(oraInstance.succeed, 'test');
      });
    });

    describe('failed', () => {
      beforeEach(() => {
        let r = new mod.Report(stream);
        return r.indeterminate('test',
          new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('no'), 10));
          }))
      });

      it('calls ora.start', () => {
        assert.called(oraInstance.start);
      });

      it('calls ora.fail', () => {
        assert.calledWith(oraInstance.fail, 'no');
      });

    });
  });

});