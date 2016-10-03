import {build, clean, DEFAULTS} from '../../../src/question/packer';
import {expect} from 'chai';
import {resolve} from 'path';
import fs from 'fs-extra';
import path from 'path';

describe('pack-question', () => {

  let rootDir = resolve('./test/integration/example-questions/one');
  
  before(function(done) {

    this.timeout(30000);

    build(rootDir, {})
    .then(() => done())
    .catch((e) => done(e))
  });

  it('builds ' + DEFAULTS.pieJs, () => {
    expect(fs.existsSync(path.join(rootDir, DEFAULTS.pieJs))).to.eql(true);
  });

  after(function(done) {
    this.timeout(30000);
    clean(rootDir, {}) 
      .then(() => done())  
      .catch(done);
  });
});