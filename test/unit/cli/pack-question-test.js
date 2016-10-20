import { expect } from 'chai';

describe('pack-question', () => {

  let cmd;

  beforeEach(() => {
    cmd = require('../../../src/cli/pack-question', {
      '../question': {},
      '../question/packer': {}
    }).default;
  });

  describe('match', () => {

    it('returns true for pack-question', () => {
      expect(cmd.match({ _: ['pack-question'] })).to.eql(true);
    });
  });
});