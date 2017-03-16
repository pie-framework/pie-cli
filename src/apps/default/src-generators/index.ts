import { ElementDeclaration } from './../../../code-gen';
import { PieTarget } from '../../../install';
import { allInOne } from './all-in-one';

export { allInOne }

export function client(declarations: ElementDeclaration[]): string {
  return declarations.map(d => d.js).join('\n');
};

export function controllers(targets: PieTarget[]) {
  const src = targets.map(t => `exports['${t.pie}'] = require('${t.target}');`);
  return src.join('\n');
};

