import { expect } from 'chai';
import { build } from '../../../src/code-gen/controller-map';
import os from 'os';
import temp from 'temp';
import fs from 'fs-extra';
import path from 'path';
import * as testHelper from '../integration-test-helper';
import Question from '../../../src/question';
import NpmDir from '../../../src/npm/npm-dir';

describe('controller-map', () => {

  describe('build', () => {

    let buildResult;

    before(function (done) {
      this.timeout(40000);

      let tmpPath = testHelper.setUpTmpQuestionAndComponents('controller-map-test');

      let questionPath = path.join(tmpPath, 'example-questions', 'one');
      let question = new Question(questionPath);
      let npmDir = new NpmDir(question.dir);
      npmDir.install(question.npmDependencies)
        .then(() => build(question))
        .then((result) => {
          console.log(result);
          buildResult = result;
          done();
        })
        .catch((e) => {
          console.log(e.stack);
          done(new Error('test error'))
        });
    });

    it('builds the js file', () => {
      expect(fs.existsSync(buildResult.path)).to.eql(true);
    });
  });
});