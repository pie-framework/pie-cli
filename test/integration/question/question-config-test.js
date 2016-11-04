import QuestionConfig from '../../../src/question/question-config';
import { expect } from 'chai';
import temp from 'temp';
import fs from 'fs-extra';
import path from 'path';

describe('Question', () => {

  let config;
  let sampleQuestion = path.resolve(path.join(__dirname, '..', 'example-questions', 'one'));
  let helloWorld = path.resolve(path.join(__dirname, '..', 'example-components', 'hello-world'));
  let tmpPath, tmpNodeModules;

  before(() => {
    tmpPath = temp.mkdirSync('question-test');
    tmpNodeModules = path.join(tmpPath, 'node_modules');
    console.log('tmpNodeModules: ', tmpNodeModules);
    fs.ensureDirSync(tmpNodeModules);
    //pretend to install hello-world
    fs.copySync(helloWorld, path.join(tmpNodeModules, 'hello-world'));
    fs.copySync(sampleQuestion, tmpPath);
    config = new QuestionConfig(tmpPath);
  });

  describe('pies', () => {
    it('returns pies', () => {
      expect(config.pies).to.eql([{
        installedPath: path.join(tmpPath, 'node_modules/hello-world'),
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

  describe('piePackages', () => {
    it('returns the name of the first package object', () => {
      expect(config.piePackages[0].name).to.eql('hello-world');
    })
  });
});