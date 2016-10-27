import { ClientBuildable } from './client';
import { ControllersBuildable } from './controllers';
import QuestionConfig from './question-config';
import { join } from 'path';
import { removeSync } from 'fs-extra';


export default class Question {

  constructor(dir, clientOpts, controllerOpts) {
    this.dir = dir;
    this.config = new QuestionConfig(dir);
    this.client = new ClientBuildable(this.config, [], clientOpts);
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
}