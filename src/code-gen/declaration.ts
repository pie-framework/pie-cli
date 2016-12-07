import { pascalCase } from 'change-case';

export interface Declaration {
  key: string;
  js: string;
}

export class ElementDeclaration implements Declaration {
  constructor(readonly tag: string, readonly path?: string) {
    this.path = this.path || this.tag;
  }

  get key() {
    return this.tag;
  }

  get js() {
    let comp = pascalCase(this.tag);
    return `import ${comp} from '${this.path}';
    customElements.define('${this.tag}', ${comp});`.split('\n').map(s => s.trim()).join('\n');
  }
}

