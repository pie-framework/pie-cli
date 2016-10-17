import jsesc from 'jsesc';
import fs from 'fs-extra';
import path from 'path';
import { removeFiles } from '../file-helper';

let mkExampleMarkup = (markup, model, controllerFile, controllerUid) => `
<!doctype html>
<html>
  <head>
    <!-- lodash is one of the supported libs on the controller side -->
    <script src="//cdnjs.cloudflare.com/ajax/libs/lodash.js/4.16.2/lodash.js" type="text/javascript"></script>
    <script src="pie.js" type="text/javascript"></script>
    <script src="${controllerFile}" type="text/javascript"></script>
    <script type="text/javascript">
    
      document.addEventListener('DOMContentLoaded', function(){

        env = {mode: 'gather'};
        model = ${jsesc(model)};
        session = [];
        
        var player = document.querySelector('pie-player');

        player.addEventListener('pie.player-ready', function(event){
          var pieController = new pie.Controller(model, window['${controllerUid}']);
          player.controller = pieController;
          player.env = env;
          player.session = session;
          
          var panel = document.querySelector('pie-control-panel');
          panel.env = { mode: 'gather' };
          panel.addEventListener('envChanged', function(event){
            console.log('envChanged', event.target.env);
            player.env = event.target.env;    
            
            if(event.target.env.mode === 'evaluate'){
              player.getOutcome().then(function(outcome){
                console.log('outcome', outcome);
                panel.score = " &nbsp; " + outcome.summary.percentage + "% (" + outcome.summary.points + "/" + outcome.summary.maxPoints + ") &nbsp; "; 
              });
            }
          });
        });
      });
    </script>
  </head>
  <body>
    <pie-control-panel></pie-control-panel>
    <pie-player>
    ${markup}
    </pie-player>
  </body>
</html>
`;

export function build(question, controller, output) {
  let example = mkExampleMarkup(question.markup, question.config, controller.filename, controller.library);
  return new Promise((resolve, reject) => {
    fs.writeFile(output, example, { encoding: 'utf8' }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    });
  });
}

export function clean(root, markupName) {
  return removeFiles(root, [markupName]);
}