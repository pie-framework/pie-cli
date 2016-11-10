import FrameworkSupport from '../../../src/framework-support';
import { expect } from 'chai';
import path from 'path';
import { buildLogger } from '../../../src/log-factory';
const logger = buildLogger();

describe('FrameworkSupport', () => {

  let frameworkSupport;

  describe('bootstrap failure', () => {

    it('fails with a bad url', (done) => {
      FrameworkSupport.bootstrap(
        __dirname,
        ['https://www.idontexistontheweb.com/support.js']
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
        ['https://www.google.com']
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

      let lessUrl = 'https://raw.githubusercontent.com/PieLabs/pie-cli/0527d896c0d2d95834817dc5f48f7c4baf7bc0f8/src/framework-support/frameworks/less.js'

      FrameworkSupport.bootstrap(
        __dirname,
        [
          path.resolve(__dirname, '../../../src/framework-support/frameworks/react.js'),
          lessUrl
        ]
      ).then(f => {
        frameworkSupport = f;
        done();
      }).catch(done);
    });


    it('has 2 frameworks', () => {
      expect(frameworkSupport.frameworks.length).to.eql(2);
    });

    it('gets a config for react', () => {
      let config = frameworkSupport.buildConfigFromPieDependencies({
        react: ['1.2.3']
      });

      logger.debug('config.npmDependencies', config.npmDependencies);
      expect(config.npmDependencies).to.eql({
        'babel-preset-react': '~6.16.0',
        'less-loader': '^2.2.3'
      });
    });
  });
});