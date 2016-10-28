import { expect } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { packExample } from '../integration-test-helper';

describe('Packer.pack', () => {

  let questionPath, question;

  before(function (done) {

    this.timeout(80000);

    let support = [
      path.join(__dirname, '_vue-support')
    ];

    packExample('index-pack-test', 'one', support)
      .then((result) => {
        questionPath = result.questionPath;
        done();
      })
      .catch((err) => done(err));
  });

  it('builds pie.js', () => {
    expect(fs.existsSync(path.join(questionPath, 'pie.js'))).to.eql(true);
  });
});