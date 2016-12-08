import { SupportInfo } from '../../framework-support/support-info';
import { ElementDeclaration, Declaration } from '../../code-gen/declaration';
import { Config } from '../../question/config';
import * as _ from 'lodash';
import ExampleHtml from './example-html';
import Js from './js';
import * as webpack from 'webpack';
import reactInfo from '../../framework-support/frameworks/react';
import lessInfo from '../../framework-support/frameworks/less';

export interface File {
  filename: string;
  dir: string;
  write: () => Promise<string>;
}

export interface NewApp {
  /** what is your output? */
  files: (config: Config, client: webpack.Configuration, controllers: webpack.Configuration) => File[];
  client: Client;
  controllers: Controllers;
}

export interface Controllers {
  dependencies: (branch: string) => { [key: string]: string };
  entryJs(declarations: Declaration[]): string;
}

export interface Client {
  dependencies: (branch: string) => { [key: string]: string };
  entryJs(declarations: Declaration[]): string;
  frameworkSupport: SupportInfo[];
}


const pieController: Declaration = {
  key: 'pie-controller',
  js: `
        import Controller from 'pie-controller';
        window.pie = window.pie || {};
        window.pie.Controller = Controller;`
};

class ExampleClient implements Client {

  //TODO: move framework dependencies here? and expose a webpackLoaders function?
  dependencies(branch: string = 'develop') {
    return {
      'pie-controller': `PieLabs/pie-controller#${branch}`,
      'pie-player': `PieLabs/pie-player#${branch}`,
      'pie-control-panel': `PieLabs/pie-control-panel#${branch}`//,
      //'react': '^15.4.1'
    }
  }

  entryJs(declarations: Declaration[]): string {
    let defaults = [
      pieController,
      new ElementDeclaration('pie-player'),
      new ElementDeclaration('pie-control-panel')
    ];

    let all: Declaration[] = _.concat(defaults, declarations);
    let initLogic = _.map(all, d => d.js).join('\n');

    return `
    if(!customElements){
      throw new Error('Custom Elements arent supported');
    }
    //
    ${initLogic}
    `;
  }

  get frameworkSupport() {
    return [reactInfo, lessInfo];
  }
}

export class NewExampleApp implements NewApp {


  readonly client: Client;
  readonly controllers: Controllers;

  constructor(readonly dir: string) {
    this.client = new ExampleClient();
    this.controllers = null;
  }

  clean() {

  }
  files(config: Config, client: webpack.Configuration, controllers: webpack.Configuration): File[] {

    let exampleHtml = new ExampleHtml(config.dir, undefined, {
      controllers: './controllers.js',
      client: 'pie.js'
    },
      {
        id: 'controllerMapId'
      },
      config);

    let clientJs = new Js(client);
    let controllersJs = new Js(controllers);

    return [
      exampleHtml,
      clientJs,
      controllersJs
    ];
  }

}