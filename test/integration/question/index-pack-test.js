import { expect } from 'chai';
import fs from 'fs-extra';
import { join } from 'path';
import { packExample } from '../integration-test-helper';

describe('Packer.pack', () => {

  let questionPath, question;

  before(function (done) {

    this.timeout(80000);


    packExample('index-pack-test', 'one', [])
      .then((result) => {
        questionPath = result.questionPath;
        done();
      })
      .catch((err) => done(err));
  });

  it('builds pie.js', () => {
    expect(fs.existsSync(join(questionPath, 'pie.js'))).to.eql(true);
  });

  it('builds controllers.js', () => {
    expect(fs.existsSync(join(questionPath, 'controllers.js'))).to.eql(true);
  });
});