import { expect } from 'chai';
import proxyquire from 'proxyquire';
import _ from 'lodash';
import { stub, spy } from 'sinon';

describe('webpack-builder', () => {

  let mod, stats;
  beforeEach(() => {

    stats = {
      hasError: stub().returns(false)
    }

    mod = proxyquire('../../../src/code-gen/webpack-builder', {
      webpack: spy(function (config, done) {
        done(null, stats);
      })
    })
  });

  describe('normalizeConfig', () => {

    it('removes duplicate loaders', () => {

      let config = {
        module: {
          loaders: [
            { loader: 'less', test: /\.less$/ },
            { loader: 'less', test: /\.less$/ }
          ]
        }
      }

      let expected = _.cloneDeep(config);
      expected.module.loaders.splice(1);
      expect(mod.normalizeConfig(config)).to.eql(expected);
    });
  });
});