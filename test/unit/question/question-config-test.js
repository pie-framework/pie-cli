import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import path from 'path';

describe('QuestionConfig', () => {
  let QuestionConfig, BuildOpts, fsExtra;

  function proxyModule() {
    return proxyquire('../../../src/question/question-config', {
      'fs-extra': fsExtra
    });
  }

  beforeEach(() => {
    fsExtra = {
      readJsonSync: sinon.stub().returns({}),
      readFileSync: sinon.stub().returns('<html></html>')
    };

    let mod = proxyModule();
    QuestionConfig = mod.QuestionConfig;
    BuildOpts = mod.BuildOpts;
  });

  describe('constructor', () => {

    it('throws an error if the dir does not contain a config.json', () => {
      fsExtra.readJsonSync = sinon.stub().throws(new Error('config.json'));
      expect(() => new QuestionConfig(__dirname, new BuildOpts())).to.throw(Error, /config\.json/);
    });

    it('throws an error if the dir does not contain a dependencies.json', () => {
      fsExtra.readJsonSync = sinon.stub();
      fsExtra.readJsonSync.withArgs(path.join(__dirname, 'config.json')).returns({});
      fsExtra.readJsonSync.withArgs(path.join(__dirname, 'dependencies.json')).throws(new Error('dependencies.json'));
      expect(() => new QuestionConfig(__dirname, new BuildOpts())).to.throw(Error, /dependencies\.json/);
    });

    it('not throw an error if the dir contains config.json + dependencies.json', () => {
      expect(() => new QuestionConfig(__dirname, new BuildOpts())).not.to.throw(Error);
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
        let q = new QuestionConfig(__dirname, new BuildOpts());
        expect(q.npmDependencies).to.eql({ 'my-pie': '../..' });
      });
    });

    describe('get pies', () => {
      it('returns 2 pie', () => {
        let q = new QuestionConfig(__dirname, new BuildOpts());
        expect(q.pies).to.eql([
          { name: 'my-pie', versions: ['1.0.0'], localPath: '../..', installedPath: path.join(__dirname, 'node_modules/my-pie') },
          { name: 'my-other-pie', versions: ['1.0.0'], localPath: undefined, installedPath: path.join(__dirname, 'node_modules/my-other-pie') }
        ]);
      });
    });

    describe('get piePackages', () => {
      beforeEach(() => {
        fsExtra = {
          readJsonSync: sinon.stub().returns({}),
          readFileSync: sinon.stub().returns('<html></html>'),
          existsSync: sinon.stub().returns(true)
        };

        QuestionConfig = proxyquire('../../../src/question/question-config', {
          'fs-extra': fsExtra
        }).QuestionConfig;
      });

      it('returns an empty array for an empty config', () => {
        let q = new QuestionConfig(__dirname, new BuildOpts());
        expect(q.piePackages).to.eql([]);
      });

      it('throws an error if node_modules does not exist', () => {
        fsExtra.existsSync = sinon.stub().withArgs(path.join(__dirname, 'node_modules')).returns(false);
        let q = new QuestionConfig(__dirname, new BuildOpts());
        expect(() => q.piePackages).to.throw(Error);
      });

      it('returns the package.json for 1 pie', () => {

        fsExtra.existsSync = sinon.stub().returns(true);
        fsExtra.readJsonSync.withArgs(
          path.join(__dirname, 'node_modules', 'my-pie', 'package.json'))
          .returns({
            name: 'my-pie',
            dependencies: {
              lodash: '*'
            }
          });
        fsExtra.readJsonSync.withArgs(
          path.join(__dirname, 'config.json'))
          .returns({
            pies: [
              {
                pie: {
                  name: 'my-pie',
                  version: '1.0.0'
                }
              }
            ]
          });
        let q = new QuestionConfig(__dirname, new BuildOpts());
        expect(q.piePackages).to.eql([{
          name: 'my-pie',
          dependencies: {
            lodash: '*'
          }
        }]);
      });
    });

  });
});
