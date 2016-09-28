import Versions from '../../../src/question/versions';
import chai, {expect} from 'chai';
chai.should();

describe('versions', () => {

  describe('rangeSpansMajorVersion', () => {

    it('returns true for a major version range', () => {
      new Versions(['~1.0.0', '~2.0.0']).isBreakingRange.should.equal(true);
    });
    
    it('returns false for range within the major version', () => {
      new Versions(['~1.2', '1.2.10']).isBreakingRange.should.equal(false);
    });
  });
});