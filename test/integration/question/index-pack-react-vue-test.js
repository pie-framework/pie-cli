import { expect } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { packExample } from '../integration-test-helper';

describe('Question.pack :: React + Vue', () => {

  let questionPath, question;

  before(function (done) {

    this.timeout(50000);
    let support = [
      path.join(__dirname, '_vue-support')
    ];

    packExample('index-pack-react-and-vue-test', 'react-and-vue-question', support)
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
