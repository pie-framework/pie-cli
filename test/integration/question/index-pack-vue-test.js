import Question from '../../../src/question';
import { BuildOpts as ClientBuildOpts } from '../../../src/question/client';
import { BuildOpts as ControllersBuildOpts } from '../../../src/question/controllers';
import { expect } from 'chai';
import { join } from 'path';
import fs from 'fs-extra';
import path from 'path';
import { setUpTmpQuestionAndComponents } from '../integration-test-helper';
import { build as buildExample } from '../../../src/code-gen/markup-example';

describe('Packer.pack :: Vue', () => {

  let questionPath, question, frameworkSupport, packer;

  before(function (done) {

    this.timeout(50000);
    let tmpPath = setUpTmpQuestionAndComponents('index-pack-vue-test');
    questionPath = join(tmpPath, 'example-questions/vue-question');

    let support = [
      path.join(__dirname, '_vue-support')
    ];

    question = new Question(questionPath, ClientBuildOpts.build(), ControllersBuildOpts.build(), support);

    question.pack()
      .then((result) => {
        buildExample(question.config, result.controllers, path.join(questionPath, 'example.html'));
        done()
      })
      .catch((e) => {
        console.log(e.stack);
        done(e)
      })
  });

  it('builds pie.js', () => {
    expect(fs.existsSync(path.join(questionPath, 'pie.js'))).to.eql(true);
  });
});