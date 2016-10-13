import Packer, { DEFAULTS } from '../../../src/question/packer';
import FrameworkSupport from '../../../src/framework-support';
import Question from '../../../src/question';
import { expect } from 'chai';
import { join } from 'path';
import fs from 'fs-extra';
import path from 'path';
import testHelper from '../integration-test-helper';

describe('Packer.pack :: Vue', () => {

  let questionPath, question, frameworkSupport, packer;

  before(function (done) {

    this.timeout(50000);
    let tmpPath = testHelper.setUpTmpQuestionAndComponents('packer-vue-test');
    let questionPath = join(tmpPath, 'vue-question');

    frameworkSupport = FrameworkSupport.bootstrap([
      path.join(__dirname, '_vue-support')
    ]);

    question = new Question(questionPath);
    packer = new Packer(question, frameworkSupport);

    packer.pack({ keepBuildAssets: true, buildExample: true })
      .then(() => done())
      .catch((e) => {
        console.log(e.stack);
        done(e)
      })
  });

  it('builds ' + DEFAULTS.pieJs, () => {
    expect(fs.existsSync(path.join(questionPath, DEFAULTS.pieJs))).to.eql(true);
  });
});