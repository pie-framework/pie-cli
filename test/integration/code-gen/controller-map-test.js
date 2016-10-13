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

    let bundlePath;

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
          done(new Error('todo..'));
        })
        .catch((e) => {
          console.log(e.stack);
          done(new Error('test error'))
        });

      // console.log('tmpPath: ', tmpPath);
      // let projectPath = path.join(__dirname, 'controller-map-project');
      // fs.copySync(projectPath, tmpPath);
      // build(tmpPath, 'config.json', 'test-bundle.js')
      //   .then((result) => {
      //     bundlePath = result.path;
      //     console.log('bundlePath:', bundlePath);
      //     console.log(fs.readFileSync(bundlePath, { encoding: 'utf8' }));
      //     done();
      //   })
      //   .catch((e) => {
      //     console.log('error: ', e);
      //     done(e);
      //   });
    });

    it('builds the js file', () => {
      expect(fs.existsSync(bundlePath)).to.eql(true);
    });
  });
});