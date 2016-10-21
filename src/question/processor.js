import { join } from 'path';
import NpmDir from '../npm/npm-dir';
import * as elementBundle from '../code-gen/element-bundle';
import * as controllerMap from '../code-gen/controller-map';
import * as markupExample from '../code-gen/markup-example';
import _ from 'lodash'
import { buildLogger } from '../log-factory';
import { CLIENT_DEPENDENCIES } from './defaults';

let logger = buildLogger();

export default class Processor {

  constructor(q, fs) {
    this._question = question;
    this._frameworkSupport = fs;

    this._dirs = {
      client: new NpmDir(this._question.dir),
      controllers: new NpmDir(join(this._question.dir, 'controllers'))
    }
  }
  /**
   * Building a question involves 2 npm based builds:
   * - client: custom element definitions + pie-player + controller 
   * - controllers: the controller logic
   */
  prepareBuild() {

    logger.silly('[prepareBuild]...');

    let clientDependencies = _.extend({},
      CLIENT_DEPENDENCIES(opts.pieBranch),
      this._question.clientDependencies);

    logger.debug('[prepareBuild] clientDependencies: ', JSON.stringify(npmDependencies));

    this._dirs.client.instal(clientDependencies)
    k

  }
}
