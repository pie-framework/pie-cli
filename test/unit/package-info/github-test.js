import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';

const ROOT = '../../../lib';

class StubHttps {
  constructor() {
    this.handlers = {};
    this.get = spy((opts, handler) => {
      this.getCallback = handler;
      return this;
    });
    this.on = spy((key, handler) => {
      this.handlers[key] = handler;
      return this;
    });
  }
}

class StubResponse {
  constructor(statusCode) {
    this.statusCode = statusCode;
    this.handlers = {};
    this.on = spy((key, handler) => {
      this.handlers[key] = handler;
    });
  }
}

let encode = (obj) => {
  let s = JSON.stringify(obj);
  return new Buffer(s).toString('base64');
}

describe('github', () => {

  let github, deps;

  beforeEach(() => {
    deps = {
      https: new StubHttps()
    };
    github = proxyquire(`${ROOT}/package-info/github`, deps).default;
  });

  describe('match', () => {

    it('matches owner/repo', () => {
      expect(github.match({ key: 'anything', value: 'owner/repo' })).not.to.be.false;
    });

    it('matches owner/repo#branch', () => {
      expect(github.match({ key: 'anything', value: 'owner/repo#branch' })).not.to.be.false;
    });

    it('doesnt match 1.0.0', () => {
      expect(github.match({ key: 'anything', value: '1.0.0' })).to.be.false;
    });

    it('doesnt match ../..', () => {
      expect(github.match({ key: 'anything', value: '../..' })).to.be.false;
    });

    it('doesnt match undefined', () => {
      expect(github.match({ key: 'anything' })).to.be.false;
    });
  });

  describe('view', () => {
    let result, response;

    describe('with 200', () => {
      beforeEach(() => {
        let keyValue = { key: 'anything', value: 'owner/repo' };
        let p = github.view(keyValue, 'dependencies')
          .then((r) => {
            result = r;
          });
        response = new StubResponse(200);
        deps.https.getCallback(response);
        let content = encode({ dependencies: { a: '1.0.0' } });
        response.handlers.data(`{ "content": "${content}" }`);
        response.handlers.end();
        return p;
      });

      it('calls https.get', () => {
        assert.calledWith(deps.https.get, {
          hostname: 'api.github.com',
          port: 443,
          path: `/repos/owner/repo/contents/package.json`,
          method: 'GET',
          headers: {
            'User-Agent': 'pie-cli'
          }
        });
      });

      it('returns the result', () => {
        expect(result).to.eql({ a: '1.0.0' });
      });

    });
  });

});