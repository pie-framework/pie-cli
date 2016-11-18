import { setUpTmpQuestionAndComponents } from '../integration-test-helper';
import { join } from 'path';
import { removeSync } from 'fs-extra';
import { run } from '../../../src/cli/manifest';
import { expect } from 'chai';
import { readJsonSync } from 'fs-extra';

describe('manifest', () => {
  let tmpPath, questionPath, manifestPath;

  beforeEach((done) => {
    tmpPath = setUpTmpQuestionAndComponents('manifest-test');
    questionPath = join(tmpPath, 'example-questions/one');
    removeSync(join(questionPath, 'dependencies.json'));
    manifestPath = join(questionPath, 'manifest.json');
    run({ dir: questionPath, outfile: manifestPath })
      .then(() => done())
      .catch(done);
  });

  it('writes out a manifest', () => {
    expect(readJsonSync(manifestPath).dependencies).to.eql({
      'hello-world': '~1.0.0'
    });
  });

});