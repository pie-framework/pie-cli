import Question from '../../../src/question';
import { BuildOpts as ClientBuildOpts } from '../../../src/question/client';
import { BuildOpts as ControllersBuildOpts } from '../../../src/question/controllers';
import { expect } from 'chai';
import { resolve } from 'path';
import fs from 'fs-extra';
import path from 'path';
import temp from 'temp';
import { setUpTmpQuestionAndComponents } from '../integration-test-helper';

describe('Packer.pack', () => {

  let rootDir = resolve('./test/integration/example-questions/one');
  let componentsDir = resolve('./test/integration/example-components');
  let questionPath, question, frameworkSupport, packer;

  before(function (done) {

    this.timeout(50000);
    let tmpPath = setUpTmpQuestionAndComponents('index-packer-test');
    console.log('packer-test tmp: ', tmpPath);
    questionPath = path.join(tmpPath, 'example-questions', 'one');

    question = new Question(questionPath, ClientBuildOpts.build(), ControllersBuildOpts.build());

    question.pack()
      .then(() => done())
      .catch((e) => {
        console.log(e.stack);
        done(e)
      })
  });

  it('builds pie.js', () => {
    expect(fs.existsSync(path.join(questionPath, 'pie.js'))).to.eql(true);
  });
});