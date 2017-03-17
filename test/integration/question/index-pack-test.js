import { packExample, setUpTmpQuestionAndComponents } from '../integration-test-helper';

import { expect } from 'chai';
import fs from 'fs-extra';
import { join } from 'path';

describe('Question', () => {

  let questionPath;

  let packCmd = require('../../../lib/cli/pack').default;

  before(function () {
    this.timeout(120000);
    let tmpPath = setUpTmpQuestionAndComponents('index-pack-test');
    questionPath = `${tmpPath}/example-questions/one`;
    console.log('questionPath: ', questionPath);
    return packCmd.run({ dir: questionPath, includeComplete: true });
  });

  it('builds pie-view.js', () => {
    expect(fs.existsSync(join(questionPath, 'pie-view.js'))).to.eql(true);
  });

  it('builds pie-controllers.js', () => {
    expect(fs.existsSync(join(questionPath, 'pie-controllers.js'))).to.eql(true);
  });

  it('builds pie-item.js', () => {
    expect(fs.existsSync(join(questionPath, 'pie-item.js'))).to.eql(true);
  });

  it('removes node_modules', () => {
    expect(fs.existsSync(join(questionPath, 'node_modules'))).to.eql(false);
  });

  it('removes controllers', () => {
    expect(fs.existsSync(join(questionPath, 'controllers'))).to.eql(false);
  });

  it('removes package.json', () => {
    expect(fs.existsSync(join(questionPath, 'package.json'))).to.eql(false);
  });

});
