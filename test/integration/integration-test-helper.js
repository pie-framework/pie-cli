import temp from 'temp';
import { resolve, join } from 'path';
import { copySync } from 'fs-extra';

export function setUpTmpQuestionAndComponents(name) {
  let questionsSrc = resolve('./test/integration/example-questions');
  let componentsSrc = resolve('./test/integration/example-components');
  let tmpPath = temp.mkdirSync(name);
  console.log('packer-test tmp: ', tmpPath);
  let questionsDestination = join(tmpPath, 'example-questions');
  let componentsDestination = join(tmpPath, 'example-components');
  copySync(questionsSrc, questionsDestination);
  copySync(componentsSrc, componentsDestination);
  return tmpPath;
}