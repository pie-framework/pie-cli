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

    const echo = () => {
      return function (k) {
        return k;
      }
    }

    deps = {
      'ora': stub().returns(oraInstance),
      'node-emoji': {
        get: spy(echo())
      },
      'log-symbols': {
        success: '',
        info: '',
        error: '',
        warning: ''
      },
      'chalk': {
        blue: spy(echo()),
        red: spy(echo()),
        green: spy(echo())
      }
    };

    mod = proxyquire('../../../lib/cli/report', deps);
  });

  describe('instance', () => {

    it('calls handler.indeterminate', () => {
      let r = new mod.Report(stream);
      r.handler = {
        indeterminate: stub()
      }
      r.instance('label');
      assert.calledWith(r.handler.indeterminate, 'label');
    });
  });

  describe('promise', () => {

    describe('successful', () => {
      beforeEach(() => {
        let r = new mod.Report(stream);
        return r.promise('test', new Promise(r => setTimeout(r, 10)))
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
        return r.promise('test',
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

  let assertCall = (fnName, chalkColor, emoji) => {

    return () => {
      beforeEach(() => {
        let r = new mod.Report(stream);
        r[fnName]('test');
      });


      it(`calls chalk.${chalkColor}`, () => {
        assert.calledWith(deps['chalk'][chalkColor], ` test\n`);
      });

      it('calls write', () => {
        assert.calledWith(stream.write, ` test\n`);
      });
    }
  }

  describe('info', assertCall('info', 'blue', 'information_source'));
  describe('success', assertCall('success', 'green', 'heavy_check_mark'));
  describe('failure', assertCall('failure', 'red', 'heavy_multiplication_x'));

});