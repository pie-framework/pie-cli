import Config, {Versions} from '../../../src/question/config';
import chai, {expect} from 'chai';
chai.should();

describe('config', () => {

  describe('npmDependencies', () => {

    it('returns no dependencies for an empty pie array', () => {
      expect(new Config([], {}).npmDependencies).to.eql({});
    });
    
    it('returns a dependency with a path from the lookup', () => {
      expect(new Config({pies: [{pie: {name: 'pie', version: '1.0.0'}}]}, {pie: 'path'}).npmDependencies).to.eql({pie: 'path'});
    });

    it('ignores version ranges', () => {
      expect(new Config({pies: [{pie: {name: 'pie', version: '1.0.0'}}]}, {}).npmDependencies).to.eql({pie: undefined});
    });
  });
});
