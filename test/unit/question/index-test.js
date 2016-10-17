import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import path from 'path';

describe('Question', () => {
  let Question, fsExtra;

  function proxyQuestion() {
    return proxyquire('../../../src/question', {
      'fs-extra': fsExtra
    }).default;
  }

  beforeEach(() => {
    fsExtra = {
      readJsonSync: sinon.stub().returns({})
    };

    Question = proxyQuestion();
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
          { name: 'my-pie', versions: ['1.0.0'], localPath: '../..', installedPath: path.join(__dirname, 'node_modules/my-pie') },
          { name: 'my-other-pie', versions: ['1.0.0'], localPath: undefined, installedPath: path.join(__dirname, 'node_modules/my-other-pie') }
        ]);
      });
    });

    describe('get piePackages', () => {
      beforeEach(() => {
        fsExtra = {
          readJsonSync: sinon.stub().returns({}),
          existsSync: sinon.stub().returns(true)
        };

        Question = proxyquire('../../../src/question', {
          'fs-extra': fsExtra
        }).default;
      });

      it('returns an empty array for an empty config', () => {
        let q = new Question(__dirname, {});
        expect(q.piePackages).to.eql([]);
      });

      it('throws an error if node_modules does not exist', () => {
        fsExtra.existsSync = sinon.stub().withArgs(path.join(__dirname, 'node_modules')).returns(false);
        let q = new Question(__dirname, {});
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
        let q = new Question(__dirname, {});
        expect(q.piePackages).to.eql([{
          name: 'my-pie',
          dependencies: {
            lodash: '*'
          }
        }]);
      });
    });

    describe('piePackageDependencies', () => {
      beforeEach(() => {

        fsExtra.existsSync = sinon.stub().returns(true);

        fsExtra.readJsonSync
          .withArgs(path.join(__dirname, 'dependencies.json'))
          .returns({})
          .withArgs(path.join(__dirname, 'config.json'))
          .returns({
            pies: [{
              pie: {
                name: 'my-pie'
              }
            }]
          })
          .withArgs(path.join(__dirname, 'node_modules/my-pie/package.json'))
          .returns({
            dependencies: {
              react: '15.0.2',
              less: '2.3.4'
            }
          });
      });

      it('returns the merged dependencies', () => {

        let q = new Question(__dirname, {});
        expect(q.piePackageDependencies).to.eql({
          react: ['15.0.2'],
          less: ['2.3.4']
        })
      });
    });

  });
});
