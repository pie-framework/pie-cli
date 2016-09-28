import * as packQuestion from '../../../src/commands/pack-question';
import {expect} from 'chai';
import {resolve} from 'path';
import fs from 'fs-extra';
import path from 'path';

describe('pack-question', () => {

  let rootDir;
  
  beforeEach((done) => {
    rootDir = resolve('./test/integration/example-questions/one');
    
    packQuestion.run({
      dir: rootDir
    })
    .then(() => done())
    .catch((e) => done(e))
  });

  it('installs the node_modules', () => {
    expect(fs.existsSync(path.join(rootDir, 'package.json'))).to.eql(true);
  })
});