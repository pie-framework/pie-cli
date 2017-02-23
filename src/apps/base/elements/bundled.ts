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

    _envUpdated(env) {
      let classFromEnv = (env) => {
        const colorMap = {
          black_on_rose: 'black-on-rose',
          white_on_black: 'white-on-black',
          black_on_white: 'default'
        };
        if (env.accessibility && env.accessibility.colorContrast && colorMap[env.accessibility.colorContrast]) {
          return colorMap[env.accessibility.colorContrast];
        } else {
          console.log('could not find class');
          return undefined;
        }
      };
      this.querySelector('pie-player').setAttribute('class', classFromEnv(env));
    }
    
    connectedCallback(){

      let pieItem = this;

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
          pieItem._envUpdated(event.target.env);

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

        <style>
          * {
            font-family: 'Roboto', sans-serif;
          }

          pie-player {
            display: block;
          }

          pie-player.black-on-rose {
            background-color: mistyrose;
          }

          pie-player.white-on-black {
            background-color: black;
            color: white;
          }

          .control-panel-holder {
            display: flex;
            align-items: center;
            background-color: rgba(0,0,0,0.1);
            padding: 0;
            margin: 0;
            padding-left: 10px;
            border-radius: 3px;
            box-shadow: 0px 2px 4px 0px rgba(0,0,0,0.31);
            margin-bottom: 20px;
          }

          .control-panel-holder > label {
            text-transform: uppercase;
            font-size: 14px;
            color: rgba(0,0,0,0.5);
          }



        </style>
        <div class="control-panel-holder">
          <label>Control Panel</label>
          <pie-control-panel></pie-control-panel> 
        </div>
        <pie-player>
          ${config.markup}
        </pie-player>
      \`;

    }
  }
  `;
}