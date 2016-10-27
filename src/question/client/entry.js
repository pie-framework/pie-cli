import { removeFiles } from '../../file-helper';
import { buildLogger } from '../../log-factory';
import _ from 'lodash';
import {join} from 'path';
import {existsSync, writeFile} from 'fs-extra';

const ENTRY_JS = 'entry.js';

const logger = buildLogger();

export default class Entry {
  constructor(root) {
    this.root = root;
    this.name = ENTRY_JS;
  }

  clean() {
    return removeFiles(this.root, [ENTRY_JS]);
  }

  write(pies) {
    let preamble = `if(!customElements){
    throw new Error('Custom Elements arent supported');
  }`;
    let defineCustomElement = (p, index) => `
  import comp${index} from '${p}';
  //customElements v1 
  customElements.define('${p}', comp${index});
  `;
    let init = (p, index) => {
      if (p.hasOwnProperty('initSrc')) {
        return p.initSrc;
      }
      else {
        return defineCustomElement(p, index);
      }
    };
    let js = `${preamble}
  ${_.map(pies, init).join('\n')};
  `;
    let entryPath = join(this.root, ENTRY_JS);
    
    if (existsSync(entryPath)) {
      logger.debug('[write] already exists - skipping: ', entryPath);
      return Promise.resolve(entryPath);
    } else {
      return new Promise((resolve, reject) => {
        let entryPath = join(this.root, ENTRY_JS);
        writeFile(join(this.root, ENTRY_JS), js, { encoding: 'utf8' }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(entryPath);
          }
        });
      });
    }
  }
}