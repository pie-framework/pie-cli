import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import http from 'http';

describe('serve', () => {
  let configuration, mod, paths, serve, server;

  configuration = require('../../../lib/cli/configuration').default;

  before(() => {
    mod = require('../../../lib/cli/serve');
    serve = mod.default;
    paths = global.it.sample;
  });

  describe('-a default', () => {

    before(function () {
      this.timeout(60000);
      return serve.run({
        app: 'default',
        dir: paths.demo,
        configuration: configuration,
        keepBuildAssets: true
      }).then((result) => {
        server = result.server;
      });
    });

    it('boots up a server on port 4000', function (done) {
      this.timeout(10000);
      let req = http.request({
        method: 'GET',
        host: 'localhost',
        port: 4000
      }, (res) => {
        expect(res.statusCode).to.eql(200);
        server.close(done);
      });
      req.on('error', (e) => {
        server.close(done);
      });
      req.end();
    });
  });

});