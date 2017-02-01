import { JsonConfig } from '../../question/config';

export function js(
  controllerPath: string,
  controller: string,
  config: JsonConfig): string {
  return `
  import controllerMap from '${controllerPath}';
  import Controller from '${controller}';

  export default class CatalogBundled extends HTMLElement {

    constructor(){
      super();
      let sr = this.attachShadow({mode: 'open'});
      sr.innerHTML = \`
      <div>catalog bundled</div>
      ${config.markup}
      \`;

    }

    update(){

      if(!this.controller || !this._env || !this._session){
        return;
      }

      this.controller.model(this._session, this._env)
        .then(r => {
          
        })
    }

    set config(c){
      this._config = c;
      this.controller = new Controller(this._config, controllerMap);
      this.update();
    }

    set env(e){
      this._env = e;
      this.update();
    }

    set session(s){
      this._session = s;
      this.update();
    }
  }
  `;
}