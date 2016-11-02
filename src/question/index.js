import { ClientBuildable } from './client';
import { ControllersBuildable } from './controllers';
import QuestionConfig from './question-config';
import { join } from 'path';
import { removeSync } from 'fs-extra';
import { buildLogger } from '../log-factory';

const logger = buildLogger();
export default class Question {

  constructor(dir, clientOpts, controllerOpts, clientFrameworkSupport, app) {
    clientFrameworkSupport = clientFrameworkSupport || [];
    this.dir = dir;
    this.config = new QuestionConfig(dir);
    this.client = new ClientBuildable(this.config, clientFrameworkSupport, clientOpts, app);
    this.controllers = new ControllersBuildable(this.config, controllerOpts);
  }

  clean() {
    return this.client.clean()
      .then(() => this.controllers.clean())
      .then(() => removeSync(this.controllers.controllersDir))
      .then(() => removeSync(join(this.dir, 'example.html')));
  }

  pack(clean = false) {
    return this.client.pack(clean)
      .then((client) => {
        return this.controllers.pack(clean)
          .then((controllers) => {
            return { client: client, controllers: controllers };
          });
      });
  }

  prepareWebpackConfigs(clean = false) {
    return this.client.prepareWebpackConfig(clean)
      .then(clientConfig => {
        logger.debug('[prepareWebpackConfig] got clientConfig:', clientConfig);
        return this.controllers.prepareWebpackConfig()
          .then(controllersConfig => {
            logger.debug('[prepareWebpackConfig] got controllersConfig:', controllersConfig);
            return {
              client: clientConfig,
              controllers: controllersConfig
            }
          });
      });
  }
}