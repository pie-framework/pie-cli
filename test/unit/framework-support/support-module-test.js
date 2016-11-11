import { expect } from 'chai';
import temp from 'temp';
import { writeFileSync } from 'fs-extra';
import { join } from 'path';
import { assert, stub, spy, match } from 'sinon';
import proxyquire from 'proxyquire';


describe('support-module', () => {

  let supportModule;

  beforeEach(() => {
    supportModule = require('../../../src/framework-support/support-module');
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

  describe('loadSupportModules', () => {

    let request, fsExtra, loaded;

    beforeEach(() => {

      let readFileSync = stub();
      readFileSync.withArgs('found.js', 'utf8').returns('module.exports = { a: "1.0.0", local: true, file: "found.js"}');
      readFileSync.withArgs('error.js', 'utf8').throws(new Error('TEST: error.js not found'));
      readFileSync.throws(new Error('TEST: default not found'));


      fsExtra = {
        readFileSync: readFileSync
      }

      request = stub();
      request.withArgs('http://server.com/found.js', match.any).yields(null, { statusCode: 200 }, 'module.exports = {remote: true}');
      request.yields(null, { statusCode: 404 }, '');

      supportModule = proxyquire('../../../src/framework-support/support-module', {
        'request': request,
        'fs-extra': fsExtra,
        'babel-core': {
          transform: spy(src => {
            return { code: src };
          })
        },
        'resolve': {
          sync: spy(p => p)
        }
      });
    });

    let init = (paths) => {
      return done => {
        supportModule.loadSupportModules('dir', paths)
          .then(m => {
            loaded = m;
            done();
          })
          .catch(done);
      }
    }

    describe('local files', () => {

      beforeEach(init(['found.js', 'found.js']));

      it('loads 2 locals', () => {
        expect(loaded.length).to.eql(2);
      });

      it('returns the sandboxed export', () => {
        expect(fsExtra.readFileSync.withArgs('found.js', 'utf8').calledTwice).to.eql(true);
        expect(loaded[0].a).to.eql('1.0.0');
        expect(loaded[0].file).to.eql('found.js');
        expect(loaded[1].a).to.eql('1.0.0');
      });

      it('calls readFileSync', () => {
        assert.calledWith(fsExtra.readFileSync, 'found.js');
      });
    });

    describe('remote urls', () => {

      beforeEach(init(['http://server.com/found.js']));

      it('calls request', () => {
        assert.calledWith(request, 'http://server.com/found.js', match.func);
      });

      it('loads 1 module', () => {
        expect(loaded[0].remote).to.eql(true);
      });
    });

    describe('local and remote', () => {

      beforeEach(init(['http://server.com/found.js', 'found.js']));

      it('loads 1 local modules', () => {
        expect(loaded[0].local).to.eql(true);
      });

      it('loads 1 remote modules', () => {
        expect(loaded[1].remote).eql(true);
      });
    });

    describe('load failure', () => {

      it('fails on local and remote', (done) => {
        supportModule.loadSupportModules('dir', ['error.js'])
          .then(() => {
            done(new Error('should have failed'));
          })
          .catch((e) => {
            expect(e.message).to.eql('error.js got a statusCode of 404');
            done();
          });
      });
    });
  });
});