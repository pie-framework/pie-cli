import { expect } from 'chai';
import proxyquire from 'proxyquire';
import _ from 'lodash';
import { assert, match, stub, spy } from 'sinon';
import { buildLogger } from '../../../src/log-factory';

const logger = buildLogger();

describe('webpack-builder', () => {

  let mod, stats, duplicateLoadersCtr, duplicateLoadersInstance, webpack;
  beforeEach(() => {

    duplicateLoadersInstance = {
      present: false,
      error: new Error('duplicate errror')
    }

    duplicateLoadersCtr = stub().returns(duplicateLoadersInstance);
    duplicateLoadersCtr['@noCallThru'] = true;
    duplicateLoadersCtr.fromConfig = stub().returns(duplicateLoadersInstance);

    stats = {
      hasErrors: stub().returns(false),
      compilation: {
        errors: []
      }
    }

    webpack = spy(function (config, done) {
      done(null, stats);
    });

    mod = proxyquire('../../../src/code-gen/webpack-builder', {
      webpack: webpack,
      './duplicate-loaders': duplicateLoadersCtr
    })
  });

  describe('build', () => {

    it('returns a rejected promise if duplicate.present = true', (done) => {
      duplicateLoadersInstance.present = true;
      mod.build({})
        .then(() => done(new Error('should have failed')))
        .catch((e) => {
          expect(e.message).to.eql(duplicateLoadersInstance.error.message)
          done()
        });
    });

    it('calls webpack', (done) => {
      mod.build({})
        .then(() => {
          assert.calledWith(webpack, {}, match.func);
          done();
        })
        .catch(done);
    });

    it('Promise is rejected if webpack fails', (done) => {

      webpack = spy(function (config, done) {
        done(new Error('e'));
      });

      mod = proxyquire('../../../src/code-gen/webpack-builder', {
        webpack: webpack,
        './duplicate-loaders': duplicateLoadersCtr
      });

      mod.build({})
        .then(() => done(new Error('should have failed')))
        .catch(e => {
          expect(e.message).to.eql('e');
          done()
        });
    });

    it('Promise is rejected if webpack stats.hasErrors returns true', (done) => {

      let badStats = {
        hasErrors: stub().returns(true),
        compilation: {
          errors: []
        }
      };

      webpack = spy(function (config, done) {
        done(null, badStats);
      });

      mod = proxyquire('../../../src/code-gen/webpack-builder', {
        webpack: webpack,
        './duplicate-loaders': duplicateLoadersCtr
      });

      mod.build({})
        .then(() => done(new Error('should have failed')))
        .catch(e => {
          expect(e.message).to.eql('Webpack build errors - see the logs');
          done();
        });
    });
  });

});