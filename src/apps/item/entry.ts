import { controllerDependency, sockJs } from '../src-snippets';

import { ElementDeclaration } from '../../code-gen';
import { Pkg } from '../../install';

export default function js(pkgs: Pkg[],
  sockPath: string) {

  const controllerPies = pkgs.filter(bi => bi.controller);
  return `
/** Auto generated by ${__filename} */

//pie controllers
let controllers = {};
${controllerPies.map(bi => controllerDependency(bi.element.tag, bi.controller.moduleId)).join('\n')}

//pie declarations
${pkgs.map(bi => new ElementDeclaration(bi.element.tag, bi.element.moduleId).js).join('\n')}

// the catalog ui
import CatalogDemo from 'pie-catalog-client/src/catalog-demo';
customElements.define('catalog-demo', CatalogDemo);

import DemoPane from 'pie-catalog-client/src/catalog-demo/demo-pane';
customElements.define('demo-pane', DemoPane);

import ItemPreview from 'pie-catalog-client/src/catalog-demo/item-preview';
customElements.define('item-preview', ItemPreview);
import ControlPanel from 'pie-catalog-client/src/catalog-demo/control-panel';
customElements.define('control-panel', ControlPanel);

require('pie-catalog-client/src/bootstrap/common.less');
require('material-elements/src/select-field');

let initSock = ${sockJs()}

let init = () => {

  let allPromises = [
    customElements.whenDefined('catalog-demo')
  ];

  Promise.all(allPromises)
    .then(() => {
      let demo = document.querySelector('catalog-demo');
      demo.config = window.demo.config;
      demo.controllers = controllers;
      demo.markup = window.demo.markup;
      demo.session = window.demo.session;
    });

    initSock('${sockPath}');
}

document.addEventListener('DOMContentLoaded', () => {
  init();
}); `;
}
