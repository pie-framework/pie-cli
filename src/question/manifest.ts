import { QuestionConfig } from './question-config';
import { dependenciesToHashAndSrc } from '../npm/dependency-helper';

export function make(dir) {
  let config = new QuestionConfig(dir);
  let dependencies = config.npmDependencies;
  let {hash, src} = dependenciesToHashAndSrc(config.npmDependencies);
  return { hash, src, dependencies };
}