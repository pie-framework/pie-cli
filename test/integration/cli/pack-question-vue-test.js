import { run as pack } from '../../../src/cli/pack-question';
import { copySync } from 'fs-extra';
import { setUpTmpQuestionAndComponents } from '../integration-test-helper';
import { expect } from 'chai';
import { join } from 'path';

describe('PackQuestionCommand', () => {
  let tmpPath, questionPath;


  beforeEach((done) => {
    tmpPath = setUpTmpQuestionAndComponents('vue-question');
    questionPath = join(tmpPath, 'example-questions/vue-question');
    copySync(join(__dirname, '../question/_vue-support.js'), join(questionPath, 'vue-support.js'));
    done();
  });

  it('packs vue', function (done) {

    this.timeout(100000);

    pack({
      dir: questionPath,
      support: './vue-support.js'
    })
      .then(exampleHtml => {
        expect(exampleHtml).to.eql(join(questionPath, 'example.html'));
        done()
      })
      .catch(done);
  });
});