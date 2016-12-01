import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import _ from 'lodash';

describe('JsonConfig', () => {

  let c, mod, Config, fsExtra, validator, raw, rawConfig, elements;

  let realElements = require('../../../../lib/question/config/elements');

  beforeEach(() => {
    fsExtra = {
      readFileSync: stub().returns('<html></htm>'),
      existsSync: stub().returns(true)
    }

    validator = {
      validate: stub().returns({ valid: true })
    }

    rawConfig = {
      elements: {
        'local-file': 'value',
        'pie-package': 'value',
        'local-package': 'value',
        'not-installed': 'value'
      },
      models: [
        { element: 'pie-package', id: '1' },
        { element: 'local-file', id: '2' }
      ]
    }

    raw = {
      fromPath: stub().returns(rawConfig)
    }


    let mkElement = (clazz) => {
      clazz.build = stub();
      return clazz;
    }

    elements = {
      LocalFile: mkElement(realElements.LocalFile),
      LocalPackage: mkElement(realElements.LocalPackage),
      PiePackage: mkElement(realElements.PiePackage)
    }

    elements.LocalFile.build.withArgs('local-file', match.string).returns(new realElements.LocalFile('local-file', 'local-file.js'));
    elements.PiePackage.build.withArgs('pie-package', match.string).returns(new realElements.PiePackage('pie-package', 'pie-package'));
    elements.LocalPackage.build.withArgs('local-package', match.string).returns(new realElements.LocalPackage('local-package', '../local-package'));

    let declaration = {
      ElementDeclaration: class {
        constructor(key, value) {
          this.key = key;
          this.value = value;
        }
      }
    }
    mod = proxyquire('../../../../lib/question/config', {
      'fs-extra': fsExtra,
      '../../npm/dependency-helper': {
        hash: stub().returns('xxxx')
      },
      '../../code-gen/declaration': declaration,
      './elements': elements,
      './raw': raw,
      './validator': validator
    });
  });


  let init = (filenames) => {
    return new mod.JsonConfig('dir', filenames);
  }

  describe('with default filenames', () => {
    beforeEach(() => {
      c = init();
    });

    describe('constructor', () => {
      it('is not undefined', () => {
        let c = new mod.JsonConfig('dir');
        expect(c).not.to.be.undefined;
      });

      it('calls fromPath', () => {
        assert.calledWith(raw.fromPath, 'dir/config.json');
      });
    });

    describe('reload', () => {
      it('calls raw._readRaw()', () => {
        c.reload();
        assert.calledTwice(raw.fromPath);
      });
    });

    describe('elements', () => {

      beforeEach(() => {
        c = init();
      });

      it('returns a LocalFile in the result', () => {
        expect(c.elements[0] instanceof realElements.LocalFile).to.eql(true);
      });

      it('returns a PiePackage in the result', () => {
        expect(c.elements[1] instanceof realElements.PiePackage).to.eql(true);
      });

      it('returns a LocalPackage in the result', () => {
        expect(c.elements[2] instanceof realElements.LocalPackage).to.eql(true);
      });

      it('returns a NotInstalledPackage in the result', () => {
        expect(c.elements[3] instanceof realElements.NotInstalledPackage).to.eql(true);
      });

    });

    describe('declarations', () => {
      let declarations;

      beforeEach(() => {
        c = init();
        declarations = c.declarations;
      });

      it('returns local file declaration', () => {
        let localFile = _.find(declarations, c => c.key === 'local-file');
        expect(localFile.value).to.eql('local-file.js');
      });

      it('returns non local file declarations', () => {
        let localFile = _.filter(declarations, c => c.key !== 'local-file');
        expect(localFile.value).to.eql(undefined);
      });
    });

    describe('dependencies', () => {

      beforeEach(() => {
        c = init();
      });

      it('returns non local files', () => {
        expect(c.dependencies).to.eql({
          'local-package': '../local-package',
          'pie-package': 'pie-package',
          'not-installed': 'value'
        })
      });
    });

    describe('localFiles', () => {

      beforeEach(() => {
        c = init();
      });

      it('returns local files', () => {
        expect(c.localFiles).to.eql({
          'local-file': 'local-file.js'
        });
      });
    });

    describe('manifest', () => {
      beforeEach(() => {
        c = init();
      });

      it('returns dependencies', () => {
        expect(c.manifest.src.dependencies).to.eql(c.dependencies);
      });

      it('returns locals', () => {
        expect(c.manifest.src.locals).to.eql({
          'local-file': {
            path: 'local-file.js',
            hash: 'xxxx'
          }
        });
      });
    });

    describe('installedPies', () => {

      beforeEach(() => {
        fsExtra.existsSync.returns(true);
        rawConfig.models = [
          {
            element: 'pie-package',
            id: '1'
          }
        ]
        c = init();
      });

      it('returns installed pies', () => {
        expect(c.installedPies).to.eql([
          new realElements.PiePackage('pie-package', 'pie-package')
        ]);
      });
    });

    describe('pieModels', () => {

      it('returns pie only models', () => {
        expect(c.pieModels).to.eql([
          { id: '1', element: 'pie-package' }
        ]);
      });
    });

    describe('elementModels', () => {
      it('returns element models', () => {
        expect(c.elementModels).to.eql([
          { id: '2', element: 'local-file' }
        ]);
      });
    });

    describe('valid', () => {

      let isValid;

      beforeEach(() => {
        isValid = c.valid();
      });

      it('calls validate', () => {
        assert.calledWith(validator.validate, rawConfig, c.installedPies);
      });

      it('returns validate().valid', () => {
        expect(isValid).to.eql(true);
      });
    });

    describe('markup', () => {
      it('calls readFileSync', () => {
        c.markup;
        assert.calledWith(fsExtra.readFileSync, 'dir/index.html');
      });
    });
  });

  describe('with custom filenames', () => {

    beforeEach(() => {
      c = init(new mod.FileNames('c.json', 'i.html'));
      console.log('c: ', c);
    });

    describe('constructor', () => {
      it('calls fromPath', () => {
        assert.calledWith(raw.fromPath, 'dir/c.json');
      });
    });

    describe('markup', () => {
      it('calls readFileSync', () => {
        c.markup;
        assert.calledWith(fsExtra.readFileSync, 'dir/i.html');
      });
    });
  });
});