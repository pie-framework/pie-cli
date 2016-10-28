import temp from 'temp';
import { resolve, join } from 'path';
import { copySync } from 'fs-extra';
import Question from '../../src/question';
import { BuildOpts as ClientBuildOpts } from '../../src/question/client';
import { BuildOpts as ControllersBuildOpts } from '../../src/question/controllers';
import { build as buildExample } from '../../src/code-gen/markup-example';
import path from 'path';

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

export function packExample(testName, exampleQuestion, support) {
  let tmpPath = setUpTmpQuestionAndComponents(testName);
  let questionPath = join(tmpPath, `example-questions/${exampleQuestion}`);
  let question = new Question(questionPath, ClientBuildOpts.build(), ControllersBuildOpts.build(), support);
  return question.pack()
    .then((result) => {
      return buildExample(question.config, result.controllers, path.join(questionPath, 'example.html'));
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