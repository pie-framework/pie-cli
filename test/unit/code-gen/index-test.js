import { expect } from 'chai';

describe('declaration', () => {
  let mod = require('../../../lib/code-gen');

  describe('ElementDeclaration', () => {
    describe('js', () => {
      it('returns a custom element declaration', () => {
        let d = new mod.ElementDeclaration('my-tag');
        expect(d.js).to.include(`customElements.define('my-tag', MyTag);`);
      });
    });
  });
});
