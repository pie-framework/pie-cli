import { ElementDeclaration } from './../../../code-gen';
import { Model } from '../../../question/config';
import { PieTarget } from '../../../install';

export function allInOne(
  pieName: string = 'pie-item',
  declarations: ElementDeclaration[],
  controllerMap: PieTarget[],
  markup: string,
  pieModels: Model[],
  weights: any,
  langs: any,
  scoringType: string = 'weighted'
): string {
  return `

  const safeDefine = (n, Clazz) => {
    if(!customElements.get(n)){
      customElements.define(n, Clazz);
    }
  }

  import Controller from 'pie-controller';

  ${declarations.map(d => d.js).join('\n')}

  import PiePlayer from 'pie-player';
  safeDefine('pie-player', PiePlayer);
  import ControlPanel from 'pie-catalog-client/src/catalog-demo/control-panel';
  safeDefine('pie-control-panel', ControlPanel);
  require('pie-catalog-client/src/bootstrap/common.less');
  require('material-elements/src/select-field');

  const controllerMap = {};
  ${controllerMap
    .map(t => `controllerMap['${t.pie}'] = require('${t.target}');`)
    .join('\n')}

  export default class Bundled extends HTMLElement{

    constructor(){
      super();
    }

    connectedCallback(){

      let model = {
        weights: ${JSON.stringify(weights || [])},
        scoringType: '${scoringType}',
        models: ${JSON.stringify(pieModels)},
        langs: ${JSON.stringify(langs)}
      };

      let controller = new Controller(model, controllerMap);
      let env = { mode: 'gather' };
      let sessions = [];

      this.addEventListener('ready', (event) => {

        if(event.target.tagName.toLowerCase() !== 'pie-player'){
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        let player = event.target;
        player.controller = controller;
        player.env(env)
          .then(() => player.sessions(sessions))

        let panel = this.querySelector('pie-control-panel');
        panel.env = env;

        controller.getLanguages().then(function (l) {
          panel.languages = l;
        }).catch(e => {
          console.error(e);
        });

        panel.addEventListener('env-changed', function (event) {
          const {env} = event.detail;
          player.env(env)
            .then(() => {
              if (env.mode === 'evaluate') {
                player.outcomes()
                  .then(outcome => {
                    const {percentage, max} = outcome.summary;
                    const points = outcome.pies.reduce((total, p) => total + p.score, 0);
                    panel.score = \` Score: \${percentage}% Points: \${points}/ \${max}\`;
                  });
              } else {
                panel.score = '';
              }
            });
        });
      });

      this.innerHTML = \`

        <style>
          * {
            font-family: 'Roboto', sans-serif;
          }

          .control-panel-holder {
            display: flex;
            align-items: center;
            background-color: var(--catalog-header-bg, rgba(0, 50, 49, 0.9));
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
          ${markup}
        </pie-player>
      \`;

    }
  }

  customElements.define('${pieName}', Bundled);
  `;
}
