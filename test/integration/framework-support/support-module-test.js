import { expect } from 'chai';

describe('support-module', () => {

  let supportModule;

  beforeEach(() => {
    supportModule = require('../../../src/framework-support/support-module');
  })

  describe('mkFromSrc', () => {


    it('builds a src module', () => {


      let src = `
        module.exports = {
          npmDependencies: {
            a: '1.0.0'
          }
        } 
      `;

      let sandboxed = supportModule.mkFromSrc(src, 'path.js');
      expect(sandboxed).to.eql({
        npmDependencies: {
          a: '1.0.0'
        }
      })
    });
  });
});