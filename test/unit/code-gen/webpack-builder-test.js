import { assert, match, spy, stub } from 'sinon';

import _ from 'lodash';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('webpack-builder', () => {

  let mod, stats, webpack;
  beforeEach(() => {

    stats = {
      hasErrors: stub().returns(false),
      compilation: {
        errors: []
      }
    }

    webpack = spy(function (config, done) {
      done(null, stats);
    });

    mod = proxyquire('../../../lib/code-gen/webpack-builder', {
      webpack: webpack
    })
  });

  describe('build', () => {

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

      mod = proxyquire('../../../lib/code-gen/webpack-builder', { webpack: webpack });

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
        },
        toJson: stub().returns({ errors: [] })
      };

      webpack = spy(function (config, done) {
        done(null, badStats);
      });

      mod = proxyquire('../../../lib/code-gen/webpack-builder', { webpack: webpack });

      mod.build({})
        .then(() => done(new Error('should have failed')))
        .catch(e => {
          expect(e.message).to.eql('Webpack build errors - see the logs');
          done();
        });
    });
  });

});