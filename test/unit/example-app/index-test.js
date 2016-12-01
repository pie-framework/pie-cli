import { expect } from 'chai';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import { resolve } from 'path';
import { parse } from 'acorn';
import { buildLogger } from '../../../lib/log-factory';
import { assert, stub, spy, match } from 'sinon';
import { join } from 'path';

const logger = buildLogger();

describe('ExampleApp', () => {
  let ExampleApp, app, jsesc, serverInstance, serverConstructor, express, expressInstance, webpackDevMiddleware;

  beforeEach(() => {

    jsesc = spy(function (model) {
      logger.silly('[spy:jsesc] >>>> model: ', model);
      return model || { jsescModel: true };
    });

    serverInstance = {
    }

    serverConstructor = stub().returns(serverInstance);

    serverConstructor.SOCK_PREFIX = () => '/sock';

    expressInstance = {
      set: stub(),
      use: stub(),
      get: stub()
    }

    express = stub().returns(expressInstance);
    express.static = stub();

    webpackDevMiddleware = stub().returns({});

    ExampleApp = proxyquire('../../../lib/example-app', {
      jsesc: jsesc,
      './server': {
        default: serverConstructor
      },
      'express': express,
      'webpack-dev-middleware': webpackDevMiddleware
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
    });

    it('returns react', () => {
      expect(support[0]).to.eql(resolve(`${__dirname}/../../../lib/framework-support/frameworks/react`));
    });

    it('returns less', () => {
      expect(support[1]).to.eql(resolve(`${__dirname}/../../../lib/framework-support/frameworks/less`));
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
      let js = app.entryJs({
        name: 'a', js: `
      import A from 'a';
      customElements.define('a', A);`});
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

      ids = {
        controllers: 'id'
      }

      markup = '<div></div>';

      app._staticExample = stub().returns('stubbed');
      app.staticMarkup(paths, ids, {
        pieModels: [],
        weights: [],
        elementModels: [],
        markup: markup,
        langs: [],
        scoringType: 'weighted'
      });
    });

    it('calls _staticExample', () => {
      assert.calledWith(app._staticExample, {
        paths: paths,
        ids: ids,
        pieModels: [],
        elementModels: [],
        scoringType: 'weighted',
        weights: [],
        langs: [],
        markup: markup
      });
    });

    it('calls jsesc', () => {
      assert.calledWith(jsesc, []);
    });
  });

  describe('_linkCompilerToServer', () => {
    let compiler, handlers, registeredHandlers;
    beforeEach(() => {
      registeredHandlers = {};
      compiler = {
        plugin: spy((key, handler) => {
          registeredHandlers[key] = handler;
        })
      }

      handlers = {
        error: stub(),
        reload: stub()
      }
      app._linkCompilerToServer('name', compiler, handlers);
    });

    it('calls compiler.plugin', () => {
      assert.calledWith(compiler.plugin, 'done', match.func);
    });

    it('done handler calls reload', (done) => {
      registeredHandlers['done']({
        hasErrors: () => false
      });

      process.nextTick(() => {
        assert.calledWith(handlers.reload, 'name');
        done();
      })
    });

    it('done handler calls error', (done) => {
      registeredHandlers['done']({
        hasErrors: () => true,
        toJson: stub().returns({ errors: [] })
      });

      process.nextTick(() => {
        assert.calledWith(handlers.error, 'name', []);
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
        pieModels: () => [],
        elementModels: () => [],
        paths: {
          controllers: 'controllers.js',
          client: 'pie.js'
        }
      }
      app._linkCompilerToServer = stub();
      app._mkApp = stub().returns({});
      result = app.server(compilers, opts)
    });

    it('calls _mkApp', () => {
      assert.calledWith(app._mkApp, compilers, opts);
    });

    it('calls new ExampleAppServer', () => {
      assert.called(serverConstructor);
    });

    it('calls _linkCompilerToServer for controllers', () => {
      assert.calledWith(app._linkCompilerToServer, 'controllers', compilers.controllers, serverInstance);
    });

    it('calls _linkCompilerToServer for client', () => {
      assert.calledWith(app._linkCompilerToServer, 'client', compilers.controllers, serverInstance);
    });

    it('returns the instance', () => {
      expect(result).to.eql(serverInstance);
    })
  });

  describe('_mkApp', () => {

    describe('errors', () => {

      it('throws an error if opts.paths is not defined', () => {
        expect(() => app._mkApp({})).to.throw('paths must be defined');
      });
    });

    describe('no errors', () => {
      let result, compilers, getHandler, config, paths, ids;

      beforeEach(() => {

        expressInstance.get = spy((path, handler) => {
          getHandler = handler;
        });

        compilers = {
          client: {
            output: {
              filename: 'pie.js'
            }
          },
          controllers: {
            output: {
              filename: 'controllers.js'
            }
          }
        };

        paths = {
          client: 'pie.js',
          controllers: 'controllers.js'
        };

        ids = {
          controllers: '1234'
        };

        config = {
          dir: 'dir',
          pieModels: [],
          elementModels: [],
          markup: '<div>stub</div>',
          scoringType: 'weighted',
          weights: [],
          langs: []
        }
        result = app._mkApp(compilers, paths, ids, config);
      });

      it('returns the app', () => {
        expect(result).to.eql(expressInstance);
      });

      it('calls express', () => {
        assert.called(express);
      });

      it('calls express.static', () => {
        assert.calledWith(express.static, 'dir');
      });

      it('sets the view engine', () => {
        assert.calledWith(expressInstance.set, 'view engine', 'pug');
      });

      it('sets the views dir', () => {
        assert.calledWith(expressInstance.set, 'views', resolve(join(__dirname, '../../../lib/example-app/views')));
      });

      it('calls webpackDevMiddleware for controllers', () => {
        assert.calledWith(webpackDevMiddleware, compilers.controllers, { publicPath: '/', noInfo: true });
      });

      it('calls webpackDevMiddleware for client', () => {
        assert.calledWith(webpackDevMiddleware, compilers.client, { publicPath: '/', noInfo: true });
      });

      it('calls app.use thrice', () => {
        assert.calledThrice(expressInstance.use);
      });

      it('calls render on GET /', () => {
        let res = {
          render: stub()
        }
        getHandler({}, res);

        assert.calledWith(
          res.render,
          'example-with-sock',
          {
            paths: paths,
            ids: ids,
            pieModels: config.pieModels,
            scoringType: 'weighted',
            weights: config.weights,
            langs: config.langs,
            elementModels: config.elementModels,
            markup: config.markup
          });
      });

    });
  });

});