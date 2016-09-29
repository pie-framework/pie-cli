import * as packQuestion from '../../../src/commands/pack-question';
import {expect} from 'chai';
import {resolve} from 'path';
import fs from 'fs-extra';
import path from 'path';

describe('pack-question', () => {

  let rootDir;
  
  before(function(done) {

    this.timeout(30000);

    rootDir = resolve('./test/integration/example-questions/one');
    
    packQuestion.run({
      dir: rootDir
    })
    .then(() => done())
    .catch((e) => done(e))
  });

  it('installs the node_modules', () => {
    expect(fs.existsSync(path.join(rootDir, 'package.json'))).to.eql(true);
  });

  it.only('writes an entry.js file', () => {
    expect(fs.existsSync(path.join(rootDir, 'entry.js'))).to.eql(true);
  });
});