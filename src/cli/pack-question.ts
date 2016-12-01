import { buildLogger } from '../log-factory';
import Question, { CleanMode } from '../question';
import CliCommand from './cli-command';
import { resolve, join } from 'path';
import ExampleApp, { App } from '../example-app';
import { removeSync, writeFileSync } from 'fs-extra';
import tmpSupport from './tmp-support';
import manifest from './manifest';

const logger = buildLogger();

export class PackQuestionOpts {
  constructor(readonly dir: string,
    readonly clean: boolean,
    readonly buildExample: boolean,
    readonly exampleFile: string,
    readonly keepBuildAssets: boolean) { }


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

  run(args, app: App = new ExampleApp()) {
    let packOpts = PackQuestionOpts.build(args);
    let dir = resolve(packOpts.dir);
    let questionOpts = Question.buildOpts(args);
    let question = new Question(dir, questionOpts, tmpSupport, app);

    logger.silly('[run] packOpts? ', packOpts);

    let maybeDeleteBuildAssets = packOpts.keepBuildAssets ? () => Promise.resolve() : () => {
      let mode = packOpts.buildExample ? CleanMode.BUILD_ONLY : CleanMode.ALL
      return question.clean(mode)
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
            controllers: result.controllers.filename,
            externals: question.client.externals
          }

          let ids = {
            controllers: result.controllers.library
          }

          logger.silly('question: ', question)
          let markup = app.staticMarkup(paths, ids, question.config);

          logger.silly('markup: ', markup);

          let examplePath = join(dir, packOpts.exampleFile);

          if (packOpts.clean) {
            removeSync(examplePath);
          }

          return writeFileSync(examplePath, markup, 'utf8');
        }
      })
      .then(() => manifest.run({ dir: dir, outfile: args.manifestOutfile }))
      .then((manifestResult) => {
        return maybeDeleteBuildAssets()
          .then(() => manifestResult);
      });
  }
}

let cmd = new PackQuestionCommand();
export default cmd;