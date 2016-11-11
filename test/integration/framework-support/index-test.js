import FrameworkSupport from '../../../src/framework-support';
import react from '../../../src/framework-support/frameworks/react';
import { expect } from 'chai';
import path from 'path';
import { buildLogger } from '../../../src/log-factory';

import http from 'http';


const logger = buildLogger();

describe('FrameworkSupport', () => {

  let server, serverUrl;

  let localUrl = (p) => `${serverUrl}${p}`;

  let responses = {
    '/bad.js': {
      statusCode: 404,
      contentType: 'text/plain'
    },
    '/good.js': {
      statusCode: 200,
      contentType: 'text/javascript',
      body: `export default {
        npmDependencies: {
          good: '1.0.0'
        },
        webpackLoaders: () => {
          return [ {loader: 'good-loader' }]
        }
      }`
    },
    '/some.html': {
      statusCode: 200,
      contentType: 'text/javascript',
      body: `<html></html>`
    }
  }

  before((done) => {
    server = http.createServer((req, res) => {

      let result = responses[req.url] || { statusCode: 404, contentType: 'text/plain' };

      logger.debug('result: ', result);

      res.writeHead(result.statusCode, {
        'Content-Type': result.contentType,
      });

      res.write(result.body || '');
      res.end();
    });
    server.on('listening', () => {
      logger.debug('server listening...');
      done();
    });

    server.listen(5001);

    serverUrl = 'http://localhost:5001';
  });

  after((done) => {
    server.close(done);
  });

  let frameworkSupport;

  describe('bootstrap failure', () => {


    it('fails with a url that returns a 404', (done) => {
      FrameworkSupport.bootstrap(
        __dirname,
        [localUrl('/bad.js')]
      ).then(f => {
        frameworkSupport = f;
        done(new Error('should have failed'));
      }).catch((e) => {
        logger.debug('error: ', e);
        done()
      });
    });

    it('fails with content that is not js', (done) => {
      FrameworkSupport.bootstrap(
        __dirname,
        [localUrl('/some.html')]
      ).then(f => {
        frameworkSupport = f;
        done(new Error('should have failed'));
      }).catch((e) => {
        logger.debug('error: ', e);
        done();
      });
    });
  });

  describe('bootstrap', () => {
    before((done) => {

      let goodUrl = localUrl('/good.js');

      FrameworkSupport.bootstrap(
        __dirname,
        [
          path.resolve(__dirname, '../../../src/framework-support/frameworks/react.js'),
          goodUrl
        ]
      ).then(f => {
        frameworkSupport = f;
        done();
      }).catch(done);
    });


    it('has 2 frameworks', () => {
      expect(frameworkSupport.frameworks.length).to.eql(2);
    });

    it('gets a config with webpackLoaders', () => {
      let config = frameworkSupport.buildConfigFromPieDependencies({
        react: ['1.2.3']
      });

      let loaders = config.webpackLoaders(p => p);
      logger.debug('loaders', loaders);

      expect(loaders).to.eql(
        react.webpackLoaders(p => p)
          .concat([{ loader: 'good-loader' }]));
    });

    it('gets a config for react', () => {
      let config = frameworkSupport.buildConfigFromPieDependencies({
        react: ['1.2.3']
      });

      logger.debug('config.npmDependencies', config.npmDependencies);
      expect(config.npmDependencies).to.eql({
        'babel-preset-react': '~6.16.0',
        'good': '1.0.0'
      });
    });
  });
});