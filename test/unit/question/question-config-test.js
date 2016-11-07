import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';
import { join } from 'path';


describe('QuestionConfig', () => {
  let BuildOpts, fsExtra;

  beforeEach(() => {
    fsExtra = {
      readJsonSync: stub(),
      readFileSync: stub()
    };
    BuildOpts = proxy.BuildOpts;
  });

  class Proxy {

    get m() {
      return proxyquire('../../../src/question/question-config', {
        'fs-extra': fsExtra
      });
    }

    get BuildOpts() {
      return this.m.BuildOpts;
    }

    get QuestionConfig() {
      return this.m.QuestionConfig;
    }
  }

  let proxy = new Proxy();

  describe('BuildOpts.build', () => {

    it('builds the defaults from undefined', () => {
      expect(BuildOpts.build()).to.eql({
        config: 'config.json',
        dependencies: 'dependencies.json',
        markup: 'index.html'
      });
    });

    it('builds the defaults from an empty object', () => {
      expect(BuildOpts.build({})).to.eql({
        config: 'config.json',
        dependencies: 'dependencies.json',
        markup: 'index.html'
      });
    });

    it('builds from arg values', () => {
      expect(BuildOpts.build({
        'questionConfigFile': 'c.json',
        'questionDependenciesFile': 'd.json',
        'questionMarkupFile': 'i.html'
      })).to.eql({
        config: 'c.json',
        dependencies: 'd.json',
        markup: 'i.html'
      });
    })
  });

  describe('constructor', () => {

    beforeEach(() => {

      fsExtra = {
        readJsonSync: stub()
          .withArgs(join(__dirname, 'config.json')).returns({})
          .withArgs(join(__dirname, 'dependencies.json')).returns({}),
        readFileSync: stub()
          .withArgs(join(__dirname, 'index.html')).returns('<div>hi</div>')
      }
    });


    it('throws an error if the dir does not contain a config.json', () => {
      fsExtra.readJsonSync.throws(new Error('config.json'));
      expect(() => new proxy.QuestionConfig(__dirname, new BuildOpts())).to.throw(Error, proxy.QuestionConfig.fileError('config.json'));
    });

    it('throws an error if the dir does not contain a dependencies.json', () => {

      fsExtra.readJsonSync.withArgs(join(__dirname, 'dependencies.json')).throws(new Error('dependencies.json'));
      expect(() => new proxy.QuestionConfig(__dirname, new BuildOpts()))
        .to.throw(Error, proxy.QuestionConfig.fileError('dependencies.json'));
    });


    it('throws an error if markup file can not be found', () => {
      fsExtra.readFileSync.withArgs(join(__dirname, 'index.html')).throws(new Error('!!'));
      expect(() => new (proxy.QuestionConfig)(__dirname, new BuildOpts()))
        .to.throw(Error, proxy.QuestionConfig.fileError('index.html'));
    });

    it('not throw an error if the dir contains config.json + dependencies.json', () => {
      expect(() => new proxy.QuestionConfig(__dirname, new BuildOpts()))
        .not.to.throw(Error);
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
      fsExtra.readJsonSync.withArgs(join(__dirname, 'config.json')).returns(config);
      fsExtra.readJsonSync.withArgs(join(__dirname, 'dependencies.json')).returns(dependencies);
    });

    describe('npmDependencies', () => {
      it('returns an object with any pie with local path as the key:value', () => {
        let q = new proxy.QuestionConfig(__dirname, new BuildOpts());
        expect(q.npmDependencies).to.eql({ 'my-pie': '../..' });
      });
    });

    describe('get pies', () => {
      it('returns 2 pie', () => {
        let q = new proxy.QuestionConfig(__dirname, new BuildOpts());
        expect(q.pies).to.eql([
          { name: 'my-pie', versions: ['1.0.0'], localPath: '../..', installedPath: join(__dirname, 'node_modules/my-pie') },
          { name: 'my-other-pie', versions: ['1.0.0'], localPath: undefined, installedPath: join(__dirname, 'node_modules/my-other-pie') }
        ]);
      });
    });

    describe('get piePackages', () => {
      beforeEach(() => {
        fsExtra = {
          readJsonSync: stub().returns({}),
          readFileSync: stub().returns('<html></html>'),
          existsSync: stub().returns(true)
        };
      });

      it('returns an empty array for an empty config', () => {
        let q = new proxy.QuestionConfig(__dirname, new BuildOpts());
        expect(q.piePackages).to.eql([]);
      });

      it('throws an error if node_modules does not exist', () => {
        fsExtra.existsSync = stub().withArgs(join(__dirname, 'node_modules')).returns(false);
        let q = new proxy.QuestionConfig(__dirname, new BuildOpts());
        expect(() => q.piePackages).to.throw(Error);
      });

      it('returns the package.json for 1 pie', () => {

        fsExtra.existsSync = stub().returns(true);
        fsExtra.readJsonSync.withArgs(
          join(__dirname, 'node_modules', 'my-pie', 'package.json'))
          .returns({
            name: 'my-pie',
            dependencies: {
              lodash: '*'
            }
          });
        fsExtra.readJsonSync.withArgs(
          join(__dirname, 'config.json'))
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
        let q = new proxy.QuestionConfig(__dirname, new BuildOpts());
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
