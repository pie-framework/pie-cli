import { build } from '../../../src/code-gen/markup-example';
import temp from 'temp';
import pug from 'pug';
import { join } from 'path';
import fs from 'fs-extra';
import { expect } from 'chai';
import jsesc from 'jsesc';

describe('markup-example', () => {

  let tempDir;

  before(() => {
    tempDir = temp.mkdirSync('markup-example');
  });

  describe('build', () => {

    it('builds the html', (done) => {
      let tempPath = join(tempDir, 'build-1.html');
      let question = { markup: '<div>hi</di>', config: [{ id: '1' }] };
      let controllers = { filename: 'controllers.js', library: 'controllerUid' };

      build(question, controllers, tempPath)
        .then((output) => {
          let src = fs.readFileSync(output, { encoding: 'utf8' });
          let expectedSrc = pug.compileFile(join(__dirname, '../../../src/server/views/example.pug'))({
            controllersFile: controllers.filename,
            controllersUid: controllers.library,
            clientFile: 'pie.js',
            model: jsesc(question.config),
            markup: question.markup
          });
          expect(src).to.eql(expectedSrc);
          done();
        })
        .catch(e => done(e));
    });
  });
});