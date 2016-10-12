import FrameworkSupport from '../../../src/framework-support';
import { expect } from 'chai';
import path from 'path';

describe('FrameworkSupport', () => {

  let frameworkSupport, target;

  before(() => {

    target = require('../../../src/framework-support/frameworks/react.js');

    frameworkSupport = FrameworkSupport.bootstrap(
      [
        path.resolve(__dirname, '../../../src/framework-support/frameworks/react.js')
      ]
    )
  });


  it('has 1 framework', () => {
    expect(frameworkSupport.frameworks.length).to.eql(1);
  });

  it('gets a config for react', () => {
    let config = frameworkSupport.buildConfigFromPieDependencies({
      react: ['1.2.3']
    });
    expect(config.npmDependencies).to.eql(target.support({ react: [] }).npmDependencies);
  });

});