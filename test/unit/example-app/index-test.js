import { expect } from 'chai';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import { resolve } from 'path';

describe('ExampleApp', () => {
  let ExampleApp, app;

  beforeEach(() => {
    ExampleApp = proxyquire('../../../src/example-app', {}).default;
    app = new ExampleApp();
  });

  describe('constructor', () => {
    it('inits _staticExample', () => {
      expect(_.isFunction(app._staticExample)).to.eql(true);
    });
  });

  describe('dependencies', () => {
    let deps = (b) => {
      return {
        'pie-controller': `PieLabs/pie-controller#${b}`,
        'pie-player': `PieLabs/pie-player#${b}`,
        'pie-control-panel': `PieLabs/pie-control-panel#${b}`
      }
    }

    it('returns default branch specific dependencies', () => {
      expect(app.dependencies()).to.eql(deps('develop'));
    });

    it('returns branch specific dependencies', () => {
      expect(app.dependencies('blah')).to.eql(deps('blah'));
    });
  });

  describe('frameworkSupport', () => {
    let support;
    beforeEach(() => {
      support = app.frameworkSupport();
      console.log(support);
    });

    it('returns react', () => {
      expect(support[0]).to.eql(resolve(`${__dirname}/../../../src/framework-support/frameworks/react`));
    });

    it('returns less', () => {
      expect(support[1]).to.eql(resolve(`${__dirname}/../../../src/framework-support/frameworks/less`));
    });
  });


  describe('entryJs', () => {
    xit('coming..', () => { });
  });
});