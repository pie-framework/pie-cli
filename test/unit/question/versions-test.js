import VersionRange from '../../../src/question/version-range';
import chai, {expect} from 'chai';
chai.should();

describe('versions', () => {

  describe('rangeSpansMajorVersion', () => {

    it('returns true for a major version range', () => {
      new VersionRange(['~1.0.0', '~2.0.0']).rangeSpansMajorVersion.should.equal(true);
    });
    
    it('returns false for range within the major version', () => {
      new VersionRange(['~1.2', '1.2.10']).rangeSpansMajorVersion.should.equal(false);
    });
  });
});