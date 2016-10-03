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
});