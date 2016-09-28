import Config, {Versions} from '../../../src/question/config';
import chai, {expect} from 'chai';
chai.should();

describe('config', () => {

  describe('npmDependencies', () => {

    it('returns the dependencies', () => {
      let config = new Config([], {});
      expect(config.npmDependencies).to.eql({});
    });
  });
});

describe('versions', () => {

  describe('isBreakingRange', () => {

    it('returns true for a breaking range', () => {
      new Versions(['~1.0.0', '2.0.0']).isBreakingRange.should.equal(true);
    });
    
    it('returns false for a non breaking range', () => {
      new Versions(['~1.2', '1.2.10']).isBreakingRange.should.equal(false);
    });
  });
});