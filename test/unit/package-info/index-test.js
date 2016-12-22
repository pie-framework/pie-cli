import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import _ from 'lodash';

describe('package-info', () => {
  let info, local, localFile;

  let some = (data) => Promise.resolve(data);

  let getInfo = (deps) => {

    local = {
      match: stub().returns(false),
      view: stub().returns(some({}))
    }

    localFile = {
      match: stub().returns(false),
      view: stub().returns(some({}))
    }

    deps = _.extend({
      './local': {
        default: stub().returns(local),
      },
      './local-file': {
        default: stub().returns(localFile),
      },
      './npm': {
        default: {
          match: stub().returns(false),
          view: stub().returns(some({})),
        }
      },
      './github': {
        default: {
          match: stub().returns(false),
          view: stub().returns(some({}))
        }
      }
    }, deps);

    let mod = proxyquire('../../../lib/package-info', deps);
    mod.info.deps = deps;
    mod.info.local = local;
    return mod;
  }

  describe('info', () => {

    let mod, result;

    describe('with local result', () => {
      beforeEach((done) => {

        mod = getInfo();

        mod.info.local.match.returns(true);
        mod.info.local.view.returns(some('local-yes'));

        mod.info('pattern', 'property', 'cwd')
          .then(r => {
            result = r;
            done();
          })
          .catch(done);
      });

      it('return local result', () => {
        expect(result).to.eql('local-yes');
      });

      it('call local.view', () => {
        assert.called(mod.info.local.view);
      });

      it('does not call npm.view', () => {
        assert.notCalled(mod.info.deps['./npm'].default.view);
      });
    });

    describe('with npm result', (done) => {
      let deps;
      beforeEach((done) => {
        deps = {
          './npm': {
            default: {
              match: stub().returns(true),
              view: stub().returns(some('npm-yes'))
            }
          }
        };

        mod = getInfo(deps);
        mod.info('pattern', 'property', 'cwd')
          .then(r => {
            result = r;
            done();
          })
          .catch(done);
      });

      it('calls local.match', () => {
        assert.called(mod.info.local.match);
      });

      it('calls npm.match', () => {
        assert.called(deps['./npm'].default.match);
      });

      it('calls npm.view', () => {
        assert.called(deps['./npm'].default.view);
      });

      it('returns npm result', () => {
        expect(result).to.eql('npm-yes');
      });
    });
  });

});