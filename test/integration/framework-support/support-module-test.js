import { expect } from 'chai';
import temp from 'temp';
import { writeFileSync } from 'fs-extra';
import { join } from 'path';

describe('support-module', () => {

  let supportModule;

  beforeEach(() => {
    supportModule = require('../../../lib/framework-support/support-module');
  })

  let expected = {
    npmDependencies: {
      a: '1.0.0'
    }
  }


  describe('mkFromPath', () => {

    let filepath;

    before(() => {
      let tmpPath = temp.mkdirSync('support-module-test');
      let src = `export default ${JSON.stringify(expected)}`;
      filepath = join(tmpPath, 'test.js');
      writeFileSync(filepath, src, 'utf8');
    });

    it('returns an object from file', () => {
      let sandboxed = supportModule.mkFromPath(filepath);
      expect(sandboxed).to.eql(expected);
    });
  });

  describe('mkFromSrc', () => {

    describe('returned RegExp', () => {
      it('returns regex', () => {
        let src = `

        console.log('exports?', exports);

        export default {
          test: /.*apple$/
        }`
        let sandboxed = supportModule.mkFromSrc(src, 'path.js');
        expect(sandboxed.test instanceof RegExp).to.eql(true);
      });
    });

    describe('returning an object', () => {

      it('returns from an es2015 export', () => {
        let src = `export default ${JSON.stringify(expected)}`;
        let sandboxed = supportModule.mkFromSrc(src, 'path.js');
        expect(sandboxed).to.eql(expected);
      });

      it('returns from a commonjs module', () => {
        let src = `module.exports = ${JSON.stringify(expected)};`
        let sandboxed = supportModule.mkFromSrc(src, 'path.js');
        expect(sandboxed).to.eql(expected);
      });
    });

    describe('returning a function', () => {
      it('returns from an es2015 export', () => {

        let src = `
       export default function(){
         return ${JSON.stringify(expected)}
       }`;
        let sandboxed = supportModule.mkFromSrc(src, 'path.js');
        expect(sandboxed()).to.eql(expected);
      });

      it('returns from an commonjs module', () => {

        let src = `
       module.exports = function(){
         return ${JSON.stringify(expected)}
       }`;
        let sandboxed = supportModule.mkFromSrc(src, 'path.js');
        expect(sandboxed()).to.eql(expected);
      });
    });
  });
});