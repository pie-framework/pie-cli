import {expect} from 'chai';

describe('declaration', () => {

  let declaration = require('../../../lib/code-gen/declaration');

  describe('ElementDeclaration', () => {
    describe('js', () => {
      it('returns a custom element declaration', () => {
        let d = new declaration.ElementDeclaration('my-tag');
        expect(d.js).to.eql(`import MyTag from 'my-tag';\ncustomElements.define('my-tag', MyTag);`);
      });
    });
  });
});