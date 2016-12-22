import NpmDir from '../../../../lib/npm/npm-dir';
import { JsonConfig } from '../../../../lib/question/config';
import { PiePackage } from '../../../../lib/question/config/elements';

import { expect } from 'chai';
import { join } from 'path';
import { setUpTmpQuestionAndComponents } from '../../integration-test-helper';

describe('config', () => {

  let questionPath, config, npmDir;

  before(() => {
    let tmpPath = setUpTmpQuestionAndComponents('config-test');
    questionPath = join(tmpPath, 'example-questions', 'one');
    config = new JsonConfig(questionPath);
    npmDir = new NpmDir(questionPath);
    console.log('dependencies: ', config.dependencies);
    return npmDir.install('config-test', config.dependencies);
  });


  describe('dependencies', () => {
    it('returns hello-world', () => {
      expect(config.dependencies).to.eql({ 'hello-world': '../../example-components/hello-world' });
    })
  });

  describe('installedPies', () => {
    it('returns the installed hello-world', () => {
      expect(config.installedPies).to.eql([
        PiePackage.build('hello-world', join(questionPath, 'node_modules/hello-world'))
      ])
    });
  });

  describe('valid', () => {
    it('returns true', () => {
      expect(config.valid()).to.eql(true);
    });
  });

  describe('with bad config', () => {

    beforeEach(() => {
      config = new JsonConfig(questionPath, { json: 'bad_config.json' })
    });

    describe('valid', () => {

      it('returns false', () => {
        expect(config.valid()).to.eql(false);
      });
    });
  })
});
