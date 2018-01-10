import { assert, match, stub } from 'sinon';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('FileNames', () => {

  let mod, fsExtra;

  beforeEach(() => {

    fsExtra = {
      existsSync: stub().returns(true)
    }

    mod = proxyquire('../../../../lib/question/config/index', {
      'fs-extra': fsExtra
    });
  });

  describe('resolveConfig', () => {

    it('resolves to js file if it exists', () => {
      const fn = mod.FileNames.build();
      expect(fn.resolveConfig('dir')).to.eql('dir/config.js');
    });

    it('resolves to json if the js file doesnt exist', () => {
      fsExtra.existsSync.withArgs('dir/config.js').returns(false)
      const fn = mod.FileNames.build();
      expect(fn.resolveConfig('dir')).to.eql('dir/config.json');
    });

    it('resolves to a custom js name', () => {
      const fn = mod.FileNames.build({ questionConfigFile: 'custom.js' });
      expect(fn.resolveConfig('dir')).to.eql('dir/custom.js');
    })
    it('resolves to a custom json name', () => {
      const fn = mod.FileNames.build({ questionConfigFile: 'custom.json' });
      expect(fn.resolveConfig('dir')).to.eql('dir/custom.json');
    })
  });

});