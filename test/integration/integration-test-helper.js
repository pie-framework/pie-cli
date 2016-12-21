import temp from 'temp';
import { resolve, join } from 'path';
import { copySync } from 'fs-extra';
import path from 'path';
import { buildLogger } from '../../lib/log-factory';

const logger = buildLogger();

export function setUpTmpQuestionAndComponents(name) {
  let questionsSrc = resolve('./test/integration/example-questions');
  let componentsSrc = resolve('./test/integration/example-components');
  let tmpPath = temp.mkdirSync(name);
  let questionsDestination = join(tmpPath, 'example-questions');
  let componentsDestination = join(tmpPath, 'example-components');
  copySync(questionsSrc, questionsDestination);
  copySync(componentsSrc, componentsDestination);
  return tmpPath;
}

export function packExample(testName, exampleQuestion, support) {
  let tmpPath = setUpTmpQuestionAndComponents(testName);
  let questionPath = join(tmpPath, `example-questions/${exampleQuestion}`);

  let cmd = require('../../lib/cli/pack').default;
  return cmd.run({
    dir: questionPath,
    includeComplete: true
  })
    .then(() => {
      return {
        questionPath: questionPath
      }
    })
    .catch((e) => {
      console.log(e.stack);
      return e;
    });
}