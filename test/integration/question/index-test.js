import Question from '../../../src/question';
import {expect} from 'chai';
import temp from 'temp';
import fs from 'fs-extra';
import path from 'path';

describe('Question', () => {

  let question;
  let sampleQuestion = path.resolve(path.join(__dirname, '..', 'example-questions', 'one'));
  let helloWorld = path.resolve(path.join(__dirname, '..', 'example-components', 'hello-world'));
  let tmpPath, tmpNodeModules;

  before(()=> {
    tmpPath = temp.mkdirSync('question-test');
    tmpNodeModules = path.join(tmpPath, 'node_modules'); 
    console.log('tmpNodeModules: ', tmpNodeModules);
    fs.ensureDirSync(tmpNodeModules);
    fs.copySync(sampleQuestion, tmpPath);
    question = new Question(tmpPath);
  });
  
  describe('pies', () => {
    it('returns pies', () => {
      expect(question.pies).to.eql([{
        localPath: '../../example-components/hello-world',
        name: 'hello-world',
        versions: ['~1.0.0']
      }]);
    });
  });

  describe('buildKeys', () => {
    it('throws an error if there are no node_modules', () => {
      expect(() => question.buildKeys).to.throw(Error);
    });

    it('returns the build keys', () => {
      fs.copySync(helloWorld, path.join(tmpNodeModules, 'hello-world'));
      expect(question.buildKeys).to.eql(['less', 'react']);
    });
  });

  describe('npm-dependencies', () => {

    it('returns the dependencies', () => {
      expect(question.npmDependencies).to.eql({
        'hello-world' : '../../example-components/hello-world'
      });
    });
  });

  describe('piePackages', () => {
    it('returns the name of the first package object', () => {
      expect(question.piePackages[0].name).to.eql('hello-world');
    })
  });
});