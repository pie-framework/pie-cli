import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import path from 'path';

describe('Question', () => {
  let Question, fsExtra;

  beforeEach(() => {
    fsExtra = {
      readJsonSync: sinon.stub().returns({})
    };

    Question = proxyquire('../../../src/question', {
      'fs-extra': fsExtra
    }).default;
  });

  describe('constructor', () => {

    it('throws an error if the dir does not contain a config.json', () => {
      fsExtra.readJsonSync = sinon.stub().throws(new Error('config.json'));
      expect(() => new Question(__dirname, {})).to.throw(Error, /config\.json/);
    });

    it('throws an error if the dir does not contain a dependencies.json', () => {
      fsExtra.readJsonSync = sinon.stub();
      fsExtra.readJsonSync.withArgs(path.join(__dirname, 'config.json')).returns({});
      fsExtra.readJsonSync.withArgs(path.join(__dirname, 'dependencies.json')).throws(new Error('dependencies.json'));
      expect(() => new Question(__dirname, {})).to.throw(Error, /dependencies\.json/);
    });

    it('not throw an error if the dir contains config.json + dependencies.json', () => {
      expect(() => new Question(__dirname, {})).not.to.throw(Error);
    });

  });

  describe('methods', () => {
    let config, dependencies;

    beforeEach(() => {
      dependencies = {
        'my-pie': '../..'
      };
      config = {
        pies: [
          {
            pie: {
              name: 'my-pie',
              version: '1.0.0'
            }
          },
          {
            pie: {
              name: 'my-other-pie',
              version: '1.0.0'
            }
          }]
      }
      fsExtra.readJsonSync.withArgs(path.join(__dirname, 'config.json')).returns(config);
      fsExtra.readJsonSync.withArgs(path.join(__dirname, 'dependencies.json')).returns(dependencies);
    });

    describe('npmDependencies', () => {
      it('returns an object with any pie with local path as the key:value', () => {
        let q = new Question(__dirname, {});
        expect(q.npmDependencies).to.eql({ 'my-pie': '../..' });
      });
    });

    describe('get pies', () => {
      it('returns 2 pie', () => {
        let q = new Question(__dirname, {});
        expect(q.pies).to.eql([
          { name: 'my-pie', versions: ['1.0.0'], localPath: '../..' },
          { name: 'my-other-pie', versions: ['1.0.0'], localPath: undefined }
        ]);
      });
    });

  });
});