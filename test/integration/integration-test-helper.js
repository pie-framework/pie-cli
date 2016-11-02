import temp from 'temp';
import { resolve, join } from 'path';
import { copySync } from 'fs-extra';
import Question from '../../src/question';
import { BuildOpts as ClientBuildOpts } from '../../src/question/client';
import { BuildOpts as ControllersBuildOpts } from '../../src/question/controllers';
import ExampleApp from '../../src/example-app';
import path from 'path';
import { writeFileSync } from 'fs-extra';
import { buildLogger } from '../../src/log-factory';

const logger = buildLogger();

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
  let example = new ExampleApp();
  let question = new Question(questionPath, ClientBuildOpts.build(), ControllersBuildOpts.build(), support, example);
  return question.pack()
    .then((result) => {
      let paths = {
        controllers: result.controllers.filename,
        client: result.client
      }

      let ids = {
        controllers: result.controllers.library
      }

      logger.info('result: ', JSON.stringify(result, null, '  '));

      let markup = example.staticMarkup(paths, ids, question.config.markup, question.config.config);

      logger.info('markup: \n', markup);

      let examplePath = path.join(questionPath, 'example.html');
      writeFileSync(examplePath, markup, 'utf8');
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