import { buildLogger } from '../log-factory';
import Question from '../question';
import CliCommand from './cli-command';
import { resolve, join } from 'path';
import ExampleApp from '../example-app';
import { softWrite } from '../file-helper';
import { removeSync } from 'fs-extra';
import tmpSupport from './tmp-support';
import { run as runManifest } from './manifest';
const logger = buildLogger();

export class PackQuestionOpts {
  constructor(readonly dir,
    readonly clean,
    readonly buildExample,
    readonly exampleFile,
    readonly keepBuildAssets) { }


  static build(args) {
    return new PackQuestionOpts(
      args.dir || process.cwd(),
      args.clean === 'true' || args.clean === true,
      args.buildExample !== 'false' && args.buildExample !== false,
      args.exampleFile || 'example.html',
      args.keepBuildAssets || false);
  }
}

class PackQuestionCommand extends CliCommand {
  constructor() {
    super('pack-question', 'generate a question package');
  }

  run(args) {
    let packOpts = PackQuestionOpts.build(args);
    let dir = resolve(packOpts.dir);
    let exampleApp = new ExampleApp();
    let questionOpts = Question.buildOpts(args);
    let question = new Question(dir, questionOpts, tmpSupport, exampleApp);

    logger.silly('[run] packOpts? ', packOpts);

    let maybeDeleteBuildAssets = packOpts.keepBuildAssets ? Promise.resolve() : () => {
      return question.clean()
        .then(() => {
          if (!packOpts.buildExample) {
            removeSync(join(dir, packOpts.exampleFile));
          }
        });
    }

    return question.pack(packOpts.clean)
      .then((result) => {
        logger.debug('pack result: ', result);

        if (packOpts.buildExample) {
          let paths = {
            client: result.client,
            controllers: result.controllers.filename
          }

          let ids = {
            controllers: result.controllers.library
          }

          logger.silly('question: ', question)
          let markup = exampleApp.staticMarkup(paths, ids, question.config.markup, question.config.config);

          logger.silly('markup: ', markup);

          let examplePath = join(dir, packOpts.exampleFile);

          if (packOpts.clean) {
            removeSync(examplePath);
          }

          return softWrite(examplePath, markup);
        }
      })
      .then(maybeDeleteBuildAssets)
      .then(() => runManifest({ outfile: args.manifestOutfile }));
  }
}

let cmd = new PackQuestionCommand();
export default cmd;