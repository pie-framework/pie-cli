import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';


describe('info-builder', () => {

  let mod, deps, gitJsInstance;

  beforeEach(() => {

    gitJsInstance = {
      revparse: stub().yields(null, 'REVPARSE'),
      tag: stub().yields(null, 'TAG')
    }

    deps = {
      'hosted-git-info': {
        fromUrl: stub().returns({
          domain: 'domain',
          project: 'project',
          ssh: stub().returns('ssh'),
          type: 'type',
          user: 'user'
        })
      },
      'simple-git': stub().returns(gitJsInstance)

    }

    mod = proxyquire('../../../../lib/apps/catalog/info-builder', deps);
  });

  describe('gitInfo', () => {
    it('calls fromUrl', () => {
      mod.gitInfo({ repository: 'user/repo' });
      assert.calledWith(deps['hosted-git-info'].fromUrl, 'user/repo');
    });
  });


  describe('npmInfo', () => {
    it('splits scope', () => {
      expect(mod.npmInfo({ name: '@scope/name' })).to.eql({ name: 'name', scope: 'scope' });
    });

    it('returns name and no scope', () => {
      expect(mod.npmInfo({ name: 'name' })).to.eql({ name: 'name' });
    });
  });

  describe('gitTag', () => {

    it('calls git js tag', () => {
      mod.gitTag('dir');
      assert.calledWith(gitJsInstance.tag, ['--points-at', 'HEAD'], match.func);
    });

    it('rejects w/ error', () => {
      gitJsInstance.tag.yields(new Error('!'));
      return mod.gitTag('dir')
        .then(r => {
          console.log('result: ', r);
          throw new Error('should have got an error')
        })
        .catch(e => {
          // do nothing
        });
    });

    it('trims', () => {
      gitJsInstance.tag.yields(null, ' TAG ');
      return mod.gitTag('dir')
        .then(r => {
          expect(r).to.eql('TAG');
        });
    });
  });

  describe('gitHash', () => {

    it('calls git hash', () => {
      return mod.gitHash('dir')
        .then(r => {
          expect(r).to.eql('REVPARSE');
        });
    });
    it('calls git hash', () => {
      gitJsInstance.revparse.yields(null, '  REVPARSE  ');
      return mod.gitHash('dir')
        .then(r => {
          expect(r).to.eql('REVPARSE');
        });
    });

    it('calls gitJsInstance.revparse short', () => {
      mod.gitHash('dir', true);
      assert.calledWith(gitJsInstance.revparse, ['--short', 'HEAD'])
    });

    it('calls gitJsInstance.revparse short:false', () => {
      mod.gitHash('dir', false);
      assert.calledWith(gitJsInstance.revparse, ['HEAD']);
    });

    it('rejects w/ error', () => {
      gitJsInstance.revparse.yields(new Error('!'));
      return mod.gitHash('dir')
        .then(r => {
          throw new Error('should have got an error')
        })
        .catch(e => {
          // do nothing
        });
    });

  });
});