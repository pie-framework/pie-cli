import { QuestionConfig } from '../../../src/question/question-config';
import NpmDir from '../../../src/npm/npm-dir';
import { expect } from 'chai';
import { join } from 'path';
import { setUpTmpQuestionAndComponents } from '../integration-test-helper';

describe('Question', () => {

  describe('question one', () => {
    let config, questionPath, npmDir;

    before(() => {
      let tmpPath = setUpTmpQuestionAndComponents('question-test');
      questionPath = join(tmpPath, 'example-questions', 'one');
      config = new QuestionConfig(questionPath);
      npmDir = new NpmDir(questionPath);
    });

    describe('pies', () => {
      it('returns pies', () => {
        expect(config.pies).to.eql([{
          installedPath: join(questionPath, 'node_modules/hello-world'),
          localPath: '../../example-components/hello-world',
          name: 'hello-world',
          versions: ['~1.0.0']
        }]);
      });
    });

    describe('npm-dependencies', () => {

      it('returns the dependencies', () => {
        expect(config.npmDependencies).to.eql({
          'hello-world': '../../example-components/hello-world'
        });
      });
    });

    describe('piePackages', function () {

      this.timeout(60000);

      before((done) => {
        npmDir.install(config.npmDependencies)
          .then(() => done())
          .catch(done);
      });

      it('returns the name of the first package object', () => {
        expect(config.piePackages[0].name).to.eql('hello-world');
      });
    });
  });

  describe('hello-world-with-bad-config-model', () => {

    let questionPath, config, npmDir;

    before(function (done) {
      this.timeout(60000);
      let tmpPath = setUpTmpQuestionAndComponents('with-bad-config');
      questionPath = join(tmpPath, 'example-questions', 'hello-world-with-bad-config-model');
      config = new QuestionConfig(questionPath);
      npmDir = new NpmDir(questionPath);
      npmDir.install(config.npmDependencies)
        .then(() => done())
        .catch(done);
    });

    describe('isConfigValid', () => {
      it.only('returns false', () => {
        expect(config.isConfigValid()).to.eql(false);
      });
    });

  });
});