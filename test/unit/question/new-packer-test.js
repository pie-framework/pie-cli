import Packer from '../../../src/question/new-packer';
import {expect} from 'chai';

describe('new-packer', () => {

  describe('clean', () => {
    it('has a logger', () => {
      let packer = new Packer({});

      expect(packer).not.be.undefined;
    });
  })
});