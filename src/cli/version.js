import {readJsonSync} from 'fs-extra';
import {join} from 'path';

export function match(args){
 let out = (args.v || args.version);
 return out;
};

export let summary = '--version | -v - print the version';

export function run(args){
  let pkg = readJsonSync(join(__dirname, '..', 'package.json'));
  console.log(`version ${pkg.version}`);
  process.exit(0);
};