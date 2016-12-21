import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import { Base } from '../helper';
import path from 'path';

const ROOT = '../../../../lib';

describe('info app', () => {
  let mod, args, InfoApp, deps, pieRoot, config, supportConfig, names, instance, result;

  beforeEach(() => {
    deps = {
      '../base': {
        BaseApp: Base
      },
      './bower': {
        install: stub()
      },
      'http': {
        createServer: stub().returns({})
      },
      'fs-extra': {
        readFileSync: stub().returns(''),
        readJsonSync: stub().returns({
          name: 'name',
          version: 'version',
          repository: {
            url: 'url'
          }
        })
      },
      './schema-loader': {
        default: stub().returns([])
      }
    }

    mod = proxyquire(`${ROOT}/apps/info`, deps);
    InfoApp = mod.default;
    args = {};
    pieRoot = 'pieRoot';
    config = { dir: 'dir' };
    supportConfig = {
      externals: []
    };

    names = {
      out: {
        completeItemTag: {
          path: './pie-item.js',
          tag: '<pie-item></pie-item>'
        }
      }
    }
    instance = new InfoApp(args, pieRoot, config, supportConfig, names);
  });

  describe('constructor', () => {
    it('constructs', () => {
      expect(instance).not.to.be.undefined;
    });
  });


  describe('install', () => {

    beforeEach(() => instance.install());

    it('calls Base.install', () => {
      assert.called(instance._super.install);
    });

    //TODO - not being picked up.
    xit('calls bowerInstall', () => {
      assert.calledWith(deps['./bower'].install, 'dir', ['PieLabs/pie-component-page#update']);
    });
  });

  describe('mkServer', () => {

    beforeEach(() => {
      result = instance.mkServer({});
    });

    it('returns httpServer', () => {
      expect(result.httpServer).not.to.be.undefined;
    });
  });


  describe('generatedAssets', () => {
    it('returns controller and viewElement', () => {
      expect(instance.generatedAssets).to.eql(['bower_components']);
    })
  });

  describe('fileMarkup', () => {

    beforeEach(() => {
      instance.template = stub();
      instance.fileMarkup();
    });

    it('calls readJsonSync', () => {
      assert.calledWith(deps['fs-extra'].readJsonSync, 'pieRoot/package.json');
    });

    it('calls readFileSync', () => {
      assert.calledWith(deps['fs-extra'].readFileSync, 'pieRoot/README.md', 'utf8');
    });

    it('calls loadSchemas', () => {
      assert.calledWith(deps['./schema-loader'].default, 'pieRoot/docs/schemas');
    });

    it('calls template', () => {
      assert.calledWith(instance.template, {
        js: ['./pie-item.js'],
        markup: '<pie-item></pie-item>',
        name: 'name',
        version: 'version',
        repositoryUrl: 'url',
        readme: match.string,
        schemas: [],
        pie: match.object
      });
    });
  });
});