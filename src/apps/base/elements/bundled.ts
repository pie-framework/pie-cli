import { JsonConfig } from '../../../question/config';
import * as jsesc from 'jsesc';

export let js = (
  controllerMapPath: string,
  controllerPath: string,
  config: JsonConfig,
  scoringType: string = 'weighted') => {

  return `

  import controllerMap from '${controllerMapPath}';
  import Controller from '${controllerPath}';
  export default class Bundled extends HTMLElement{

    constructor(){
      super();
    }
    
    connectedCallback(){

      let model = {
        weights: ${JSON.stringify(config.weights || [])},
        scoringType: '${scoringType}',
        pies: ${JSON.stringify(config.pieModels)},
        langs: ${JSON.stringify(config.langs)}
      };
      
      let controller = new Controller(model, controllerMap);
      let env = { mode: 'gather' };
      let session = [];
      let elementModels = ${JSON.stringify(config.elementModels || [])};

      this.addEventListener('pie.player-ready', (event) => {

        event.preventDefault();
        event.stopImmediatePropagation();

        let player = event.target;
        player.controller = controller;
        player.env = env;
        player.session = session;
        player.elementModels = elementModels;

        let panel = this.querySelector('pie-control-panel');
        panel.env = env;

        controller.getLanguages().then(function (l) {
          panel.languages = l;
        }).catch(e => {
          console.error(e);
        });

        panel.addEventListener('envChanged', function (event) {

          player.env = event.target.env;

          if (event.target.env.mode === 'evaluate') {
            player.getOutcome().then(function (outcome) {
              panel.score = ' Score: ' + outcome.summary.percentage + '% Points: ' + outcome.summary.points + '/' + outcome.summary.maxPoints;
            });
          } else {
            panel.score = '';
          }
        });
      });
      
      this.innerHTML = \`
        <pie-control-panel></pie-control-panel> 
        <pie-player>
          ${config.markup}
        </pie-player>
      \`;

    }
  }
  `;
}