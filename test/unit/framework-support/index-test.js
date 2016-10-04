import proxyquire from 'proxyquire';
import sinon from 'sinon';
import { expect } from 'chai';

describe('framework-support', () => {


  describe('bootstrap', () => {

    let FrameworkSupport, pathToObject, support, fsExtra;

    beforeEach(() => {

      fsExtra = {
        readdirSync: sinon.stub().returns(['support.js']),
        lstatSync: sinon.stub().returns({ isFile: sinon.stub().returns(true) })
      };

      FrameworkSupport = proxyquire('../../../src/framework-support', {
        'fs-extra': fsExtra,
        './dependency-tree-helper': {
          flattenDependencies: sinon.stub().returns([])
        }
      }).default;

      pathToObject = sinon.stub().returns({ support: () => { } });
    });

    it('reads in modules from the dir', () => {
      support = FrameworkSupport.bootstrap(['dir'], pathToObject);
      expect(support.frameworks.length).to.eql(1);
    });

    it('reads in 2 modules from 2 different dirs', () => {
      support = FrameworkSupport.bootstrap(['dir', 'dir-two'], pathToObject);
      expect(support.frameworks.length).to.eql(2);
    });

    it('reads in 2 modules from the same dir', () => {
      fsExtra.readdirSync.returns(['a.js', 'b.js']);
      support = FrameworkSupport.bootstrap(['dir'], pathToObject);
      expect(support.frameworks.length).to.eql(2);
    });
  });

  describe('load', () => {

    let FrameworkSupport, fs, supportModules;

    beforeEach(() => {

      FrameworkSupport = require('../../../src/framework-support').default;
      
      fs = new FrameworkSupport([
        {
          support: (name) => {
            if(name !== 'a'){
              return;
            }
            return { 
              npmDependencies: { a: '1.0.0'},
              webpackLoaders: () => []
            }
          }
      }
      ]);
      
      supportModules = fs.load({a: '1.0.0', b: '1.0.0'});
    })
    
    it('returns first supported module\'s npmDependencies', () => {
      expect(supportModules.a.npmDependencies.a).to.eql('1.0.0');
    });
    
    it('doesnt return support for 2nd module', () => {
      expect(supportModules.b).to.be.undefined; 
    });
  });
});