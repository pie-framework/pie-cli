import { expect } from 'chai';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import { resolve } from 'path';
import { parse } from 'acorn';
import { buildLogger } from '../../../src/log-factory';

const logger = buildLogger();

describe('ExampleApp', () => {
  let ExampleApp, app;

  beforeEach(() => {
    ExampleApp = proxyquire('../../../src/example-app', {}).default;
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
});