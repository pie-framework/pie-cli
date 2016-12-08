import { File } from './index';
import { Config } from '../../question/config';
import { join } from 'path';
import * as pug from 'pug';
import * as jsesc from 'jsesc';
import { writeFile } from 'fs-extra';

const templatePath = join(__dirname, '../example/views/example.pug');
const render = pug.compileFile(templatePath, { pretty: true });

export default class ExampleHtml implements File {
  readonly content: string;
  constructor(
    readonly dir,
    readonly filename = 'example.html',
    private paths,
    private ids,
    private config: Config
  ) { }

  write() {
    let content = render({
      paths: this.paths,
      ids: this.ids,
      pieModels: jsesc(this.config.pieModels as any),
      weights: jsesc(this.config.weights as any),
      scoringType: this.config.scoringType,
      elementModels: jsesc(this.config.elementModels as any),
      markup: this.config.markup,
      langs: jsesc(this.config.langs as any)
    });

    return new Promise((resolve, reject) => {
      let fullPath = join(this.dir, this.filename);
      writeFile(fullPath, content, 'utf8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(fullPath);
        }
      });
    });
  }
}
