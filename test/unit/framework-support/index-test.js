import proxyquire from 'proxyquire';
import sinon from 'sinon';
import { expect } from 'chai';

describe('framework-support', () => {


  describe('bootstrap', () => {

    let FrameworkSupport, support, fsExtra, resolve, mockRequire;

    beforeEach(() => {

      mockRequire = sinon.stub().returns({
        support: sinon.stub().returns({
          npmDependencies: {},
          webpackLoaders: (/*resolve*/) => {
            return []
          }
        })
      });

      fsExtra = {
        readdirSync: sinon.stub().returns(['support.js']),
        lstatSync: sinon.stub().returns({ isFile: sinon.stub().returns(true) })
      };

      resolve = {
        sync: sinon.spy(function(p){ return p;})
      }

      FrameworkSupport = proxyquire('../../../src/framework-support', {
        'fs-extra': fsExtra,
        resolve: resolve
      }).default;
    });

    it('reads in modules from the dir', () => {
      support = FrameworkSupport.bootstrap(['path/to/support.js'], mockRequire);
      expect(support.frameworks.length).to.eql(1);
    });

    it('reads in 2 modules from the dir', () => {
      support = FrameworkSupport.bootstrap([
        'path/to/support.js', 
        'some/other/path.js'], mockRequire);
      expect(support.frameworks.length).to.eql(2);
    });

  });

  describe('buildConfigFromKeys', () => {

    let frameworkSupport, FrameworkSupport;

    beforeEach(() => {
      FrameworkSupport = require('../../../src/framework-support').default;
      frameworkSupport = new FrameworkSupport([{
        support: (key) => {
          if(key == 'unknown-key'){
            return undefined;
          }
          return {
            npmDependencies: {
              'babel-preset-react' : '1.0'
            },
            webpackLoaders: (/*resolve*/) => {
              return [
                {test: 'test'}
              ]; 
            }
          }
        }
      }]);
    });

    it('throws an error if the config is not found', () => {
      expect( () => frameworkSupport.buildConfigFromKeys(['unknown-key']) ).to.throw(Error);
    });

    it('returns a build config with npmDependencies', () => {
      let config = frameworkSupport.buildConfigFromKeys(['react']);
      expect(config.npmDependencies).to.eql({
        'babel-preset-react' : '1.0'
      });
    });

    it('returns a config with webpackLoaders', () => {
      let config = frameworkSupport.buildConfigFromKeys(['react']);
      expect(config.webpackLoaders()).to.eql([{test: 'test'}]);
    });
  });

});