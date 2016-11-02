import jsesc from 'jsesc';
import fs from 'fs-extra';
import { removeFiles } from '../file-helper';
import pug from 'pug';
import { join, resolve } from 'path';
import { buildLogger } from '../../log-factory';
const logger = buildLogger();

const templatePath = resolve(join(__dirname, './server/views/blah.pug'));
logger.info('templatePath: ', templatePath);
const compiledFunction = pug.compileFile(templatePath);

let mkExampleMarkup = (markup, model, controllersFile, controllersUid) => {
  let escapedModel = jsesc(model);

  return compiledFunction({
    controllersFile: controllersFile,
    controllersUid: controllersUid,
    clientFile: 'pie.js',
    model: escapedModel,
    markup: markup
  });
};

export function build(question, controllers, output) {
  let example = mkExampleMarkup(question.markup, question.config, controllers.filename, controllers.library);
  return new Promise((resolve, reject) => {
    fs.writeFile(output, example, { encoding: 'utf8' }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    });
  });
}

export function clean(root, markupName) {
  return removeFiles(root, [markupName]);
}