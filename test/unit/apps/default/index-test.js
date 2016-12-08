import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import path from 'path';
import { Base } from '../helper';

const ROOT = '../../../../lib';

describe('index', () => {

  let DefaultApp, instance, mod, deps, args, jsonConfig, supportConfig, names, result;

  beforeEach(() => {
    deps = {
      '../base': {
        BaseApp: Base
      }
    }
    mod = proxyquire(`${ROOT}/apps/default`, deps);
    DefaultApp = mod.default;
    args = {};
    jsonConfig = { dir: 'dir', declarations: [] };
    supportConfig = {
      externals: {
        js: []
      }
    };
    names = {
      out: {
        viewElements: 'pie-view.js',
        controllers: 'pie-controller.js',
        completeItemTag: {
          tag: 'pie-item',
          path: './pie-item.js'
        }
      }
    };
    instance = new DefaultApp(args, jsonConfig, supportConfig, names);
  });

  describe('constructor', () => {
    it('constructs', () => {
      expect(instance).not.to.be.undefined;
    });
  });

  describe('buildPie', () => {
    beforeEach(() => {
      instance.allInOneBuild = {
        js: stub().returns('//js..'),
        client: {
          build: stub().returns(Promise.resolve('client.js'))
        }
      }
      return instance.buildPie().then(r => result = r);
    });

    it('calls allInOneBuild.js', () => {
      assert.called(instance.allInOneBuild.js);
    });

    it('calls client.build', () => {
      assert.calledWith(instance.allInOneBuild.client.build, '//js..', names.out.viewElements);
    });

    it('returns the files', () => {
      expect(result).to.eql(['client.js']);
    });
  });

  describe('buildControllers', () => {

    beforeEach(() => {
      instance.allInOneBuild = {
        controllers: {
          build: stub().returns('controllers.js')
        }
      }
      return instance.buildControllers().then(r => result = r)
    });

    it('calls allInOneBuild.controllers.build', () => {
      assert.calledWith(instance.allInOneBuild.controllers.build, names.out.controllers, path.basename(names.out.controllers, '.js'));
    });
  });

  describe('serverMarkup', () => {
    beforeEach(() => {
      instance.templates.withSock = stub();
      instance.serverMarkup();
    });

    it('calls templates.withSock', () => {
      assert.calledWith(instance.templates.withSock, {
        sockPath: match.string,
        js: [names.out.completeItemTag.path],
        markup: names.out.completeItemTag.tag
      })
    });
  });

  describe('fileMarkup', () => {
    beforeEach(() => {
      instance.templates.basic = stub();
      instance.fileMarkup();
    });

    it('calls templates.basic', () => {
      assert.calledWith(instance.templates.basic, {
        js: [names.out.completeItemTag.path],
        markup: names.out.completeItemTag.tag
      });
    });
  });

  describe('buildAssets', () => {
    beforeEach(() => {
      instance.allInOneBuild = {
        client: {
          entryJsPath: 'client.entry.js'
        }
      }
    });

    it('returns allInOneBuild.client.entryJsPath', () => {
      expect(instance.buildAssets).to.eql([instance.allInOneBuild.client.entryJsPath]);
    })
  });

  describe('generatedAssets', () => {
    it('returns controller and viewElement', () => {
      expect(instance.generatedAssets).to.eql([names.out.viewElements, names.out.controllers]);
    })
  });
});