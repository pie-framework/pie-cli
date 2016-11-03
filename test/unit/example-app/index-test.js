import { expect } from 'chai';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import { resolve } from 'path';
import { parse } from 'acorn';
import { buildLogger } from '../../../src/log-factory';
import sinon from 'sinon';

const logger = buildLogger();

describe('ExampleApp', () => {
  let ExampleApp, app, jsesc, serverInstance, serverConstructor;

  beforeEach(() => {

    jsesc = sinon.stub();

    serverInstance = {
    }

    serverConstructor = sinon.stub().returns(serverInstance);

    serverConstructor.SOCK_PREFIX = () => '/sock';

    ExampleApp = proxyquire('../../../src/example-app', {
      jsesc: jsesc,
      './server': {
        default: serverConstructor
      }
    }).default;
    app = new ExampleApp();
  });

  describe('constructor', () => {
    it('inits _staticExample', () => {
      expect(_.isFunction(app._staticExample)).to.eql(true);
    });
  });

  describe('dependencies', () => {
    let deps = (b) => {
      return {
        'pie-controller': `PieLabs/pie-controller#${b}`,
        'pie-player': `PieLabs/pie-player#${b}`,
        'pie-control-panel': `PieLabs/pie-control-panel#${b}`
      }
    }

    it('returns default branch specific dependencies', () => {
      expect(app.dependencies()).to.eql(deps('develop'));
    });

    it('returns branch specific dependencies', () => {
      expect(app.dependencies('blah')).to.eql(deps('blah'));
    });
  });

  describe('frameworkSupport', () => {
    let support;
    beforeEach(() => {
      support = app.frameworkSupport();
      console.log(support);
    });

    it('returns react', () => {
      expect(support[0]).to.eql(resolve(`${__dirname}/../../../src/framework-support/frameworks/react`));
    });

    it('returns less', () => {
      expect(support[1]).to.eql(resolve(`${__dirname}/../../../src/framework-support/frameworks/less`));
    });
  });

  describe('entryJs', () => {
    let ast;

    let findImport = (name) => {
      return _.find(ast.body, (n) => {
        return n.type === 'ImportDeclaration' && n.source.value === name;
      });
    }

    let findSpecifier = (decl) => {
      return _.find(decl.specifiers, s => s.type === 'ImportDefaultSpecifier');
    };

    let expressions = () => _.filter(ast.body, n => n.type === 'ExpressionStatement');

    let callExpressions = () => _.filter(expressions(), n => n.expression.type === 'CallExpression');

    let findCustomElementsDefine = (variableId) => {
      let exprs = _.filter(callExpressions(), n => {
        return n.expression.callee.object.name === 'customElements' &&
          n.expression.callee.property.name === 'define';
      });

      return _.find(exprs, n => {
        return n.expression.arguments[1].name === variableId;
      });
    };

    let definesCustomElement = (name) => {
      let i = findImport(name);
      let variableId = findSpecifier(i).local.name;
      let defineStatement = findCustomElementsDefine(variableId);
      logger.silly('[definesCustomElement]', defineStatement);
      return defineStatement !== undefined;
    };

    beforeEach(() => {
      let js = app.entryJs('a');
      ast = parse(js, { ecmaVersion: 6, sourceType: 'module' });
    });

    let assertDefinesCustomElement = (name) => {
      it(`defines ${name}`, () => {
        expect(definesCustomElement(name)).to.eql(true);
      });
    }

    assertDefinesCustomElement('a');
    assertDefinesCustomElement('pie-player');
    assertDefinesCustomElement('pie-control-panel');
  });

  describe('staticMarkup', () => {

    let paths, ids, markup, model;
    beforeEach(() => {

      paths = {
        client: 'client',
        controllers: 'controllers'
      }

      ids: {
        controllers: 'id'
      }

      markup: '<div></div>';
      model: {
        pies: []
      }

      app._staticExample = sinon.stub().returns('stubbed');
      app.staticMarkup(paths, ids, markup, model);
    });

    it('calls _staticExample', () => {
      sinon.assert.calledWith(app._staticExample, {
        paths: paths,
        ids: ids,
        model: model,
        markup: markup
      })
    });

    it('calls jsesc', () => {
      sinon.assert.calledWith(jsesc, model);
    });
  });

  describe('_linkCompilerToServer', () => {
    let compiler, handlers, registeredHandlers;
    beforeEach(() => {
      registeredHandlers = {};
      compiler = {
        plugin: sinon.spy((key, handler) => {
          registeredHandlers[key] = handler;
        })
      }

      handlers = {
        error: sinon.stub(),
        reload: sinon.stub()
      }
      app._linkCompilerToServer('name', compiler, handlers);
    });

    it('calls compiler.plugin', () => {
      sinon.assert.calledWith(compiler.plugin, 'done', sinon.match.func);
    });

    it('done handler calls reload', (done) => {
      registeredHandlers['done']({
        hasErrors: () => false
      });

      process.nextTick(() => {
        sinon.assert.calledWith(handlers.reload, 'name');
        done();
      })
    });

    it('done handler calls error', (done) => {
      registeredHandlers['done']({
        hasErrors: () => true,
        toJson: sinon.stub().returns({ errors: [] })
      });

      process.nextTick(() => {
        sinon.assert.calledWith(handlers.error, 'name', []);
        done();
      })
    });
  });

  describe('server', () => {
    let compilers, opts, result;
    beforeEach(() => {

      compilers = {
        client: {},
        controllers: {}
      }
      opts = {
        paths: {
          controllers: 'controllers.js',
          client: 'pie.js'
        }
      }
      app._linkCompilerToServer = sinon.stub();
      app._mkApp = sinon.stub().returns({});
      result = app.server(compilers, opts)
    });

    it('calls _mkApp', () => {
      sinon.assert.calledWith(app._mkApp, compilers, opts);
    });

    it('calls new ExampleAppServer', () => {
      sinon.assert.called(serverConstructor);
    });

    it('calls _linkCompilerToServer for controllers', () => {
      sinon.assert.calledWith(app._linkCompilerToServer, 'controllers', compilers.controllers, serverInstance);
    });

    it('calls _linkCompilerToServer for client', () => {
      sinon.assert.calledWith(app._linkCompilerToServer, 'client', compilers.controllers, serverInstance);
    });

    it('returns the instance', () => {
      expect(result).to.eql(serverInstance);
    })
  });

  describe('_mkApp', () => {

    it('throws an error if paths is not defined', () => {
      app._mkApp({}, {})
    });
  });

});