import { expect } from 'chai';
import fs from 'fs-extra';
import { join } from 'path';
import { packExample, setUpTmpQuestionAndComponents } from '../integration-test-helper';

describe('Question', () => {

  let questionPath;
  describe('pack', () => {

    before(function (done) {

      this.timeout(120000);

      packExample('index-pack-test', 'one', [])
        .then((result) => {
          questionPath = result.questionPath;
          done();
        })
        .catch(done);
    });

    it('builds pie.js', () => {
      expect(fs.existsSync(join(questionPath, 'pie.js'))).to.eql(true);
    });

    it('builds controllers.js', () => {
      expect(fs.existsSync(join(questionPath, 'controllers.js'))).to.eql(true);
    });

  });

  describe('post pack cleanup', () => {

    let packCmd = require('../../../lib/cli/pack').default;

    before(function (done) {
      this.timeout(120000);

      let tmpPath = setUpTmpQuestionAndComponents('post-pack-cleanup');
      questionPath = `${tmpPath}/example-questions/one`;
      console.log('packCmd: ', packCmd)
      packCmd.run({ dir: questionPath })
        .then(done.bind(null, null))
        .catch(done);
    });

    //Note: buildExample defaults to true.
    it('does not remove controllers.js', () => {
      expect(fs.existsSync(join(questionPath, 'controllers.js'))).to.eql(true);
    });

    it('does not remove pie.js', () => {
      expect(fs.existsSync(join(questionPath, 'pie.js'))).to.eql(true);
    });

    it('removes node_modules', () => {
      expect(fs.existsSync(join(questionPath, 'node_modules'))).to.eql(false);
    });


    it('removes controllers', () => {
      expect(fs.existsSync(join(questionPath, 'controllers'))).to.eql(false);
    });


    it('removes package.json', () => {
      expect(fs.existsSync(join(questionPath, 'package.json'))).to.eql(false);
    });

    it('removes entry.js', () => {
      expect(fs.existsSync(join(questionPath, 'entry.js'))).to.eql(false);
    });

  });
});
