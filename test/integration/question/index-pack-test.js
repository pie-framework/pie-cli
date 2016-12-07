import { expect } from 'chai';
import fs from 'fs-extra';
import { join } from 'path';
import { packExample, setUpTmpQuestionAndComponents } from '../integration-test-helper';

describe('Question', () => {

  let questionPath;

  let packCmd = require('../../../lib/cli/pack-question').default;

  before(function (done) {
    this.timeout(120000);

    let emptyApp = {
      entryJs: () => '',
      frameworkSupport: () => [],
      dependencies: () => { },
      staticMarkup: () => `<html></html>`,
      server: () => null
    };

    let tmpPath = setUpTmpQuestionAndComponents('post-pack-cleanup');
    questionPath = `${tmpPath}/example-questions/one`;
    console.log('packCmd: ', packCmd)
    packCmd.run({ dir: questionPath }, emptyApp)
      .then(done.bind(null, null))
      .catch(done);
  });


  it('builds pie.js', () => {
    expect(fs.existsSync(join(questionPath, 'pie.js'))).to.eql(true);
  });

  it('builds controllers.js', () => {
    expect(fs.existsSync(join(questionPath, 'controllers.js'))).to.eql(true);
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

  it('removes entry.js', () => {
    expect(fs.existsSync(join(questionPath, 'entry.js'))).to.eql(false);
  });

});
