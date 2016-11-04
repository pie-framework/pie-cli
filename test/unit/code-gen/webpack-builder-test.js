import { expect } from 'chai';
import proxyquire from 'proxyquire';
import _ from 'lodash';
import { stub, spy } from 'sinon';
import { buildLogger } from '../../../src/log-factory';

const logger = buildLogger();

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
    let config, result, expected;

    beforeEach(() => {
      config = {
        module: {
          loaders: [
            { loader: 'less', test: /\.less$/ },
            { loader: 'less', test: /\.less$/ },
            { loader: 'less-loader', test: /\.less$/ },
            { loader: 'path/to/less-loader.js', test: /\.less$/ }
          ]
        }
      }

      expected = _.cloneDeep(config);
      expected.module.loaders.splice(1, 3);
      result = mod.normalizeConfig(config);
    });

    describe('single loader name', () => {
      it('normalized has no duplicate loaders', () => {
        expect(result.normalized).to.eql(expected);
      });


      it('duplicates contains the duplicates', () => {
        logger.silly('config: ', config);
        let duplicates = _.cloneDeep(config.module.loaders).splice(1, 3);
        logger.silly('duplicates: ', JSON.stringify(duplicates));
        logger.silly('result.duplicates: ', JSON.stringify(result.duplicates));
        expect(result.duplicates).to.eql({ 'less-loader': duplicates });
      });
    });

  });
});