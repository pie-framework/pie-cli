import jsesc from 'jsesc';
import fs from 'fs-extra';
import { removeFiles } from '../file-helper';

let mkExampleMarkup = (markup, model, controllerFile, controllerUid) => `
<!doctype html>
<html>
  <head>
    <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
    <!-- lodash is one of the supported libs on the controller side -->
    <script src="//cdnjs.cloudflare.com/ajax/libs/lodash.js/4.16.2/lodash.js" type="text/javascript"></script>
    <script src="pie.js" type="text/javascript"></script>
    <script src="${controllerFile}" type="text/javascript"></script>
    <script type="text/javascript">

        window.pie = window.pie || {};
        window.pie.env = {mode: 'gather'};
        window.pie.model = ${jsesc(model)};
        window.pie.session = [];
        
        document.addEventListener('pie.player-ready', function(event){
          var player = event.target;
          var pieController = new pie.Controller(window.pie.model, window['${controllerUid}']);
          player.controller = pieController;
          player.env = window.pie.env;
          player.session = window.pie.session;
          
          var panel = document.querySelector('pie-control-panel');
          panel.env = window.pie.env;
          
          pieController.getLanguages().then(function(l) {
            panel.languages = l;  
          });
          
          
          panel.addEventListener('envChanged', function(event){
            console.log('envChanged', event.target.env);
            player.env = event.target.env;    
            
            if (event.target.env.mode === 'evaluate') {
              player.getOutcome().then(function(outcome) {
                console.log('outcome', outcome);
                panel.score = ' Score: ' + outcome.summary.percentage + '% Points: ' + outcome.summary.points + '/' + outcome.summary.maxPoints;
              });
            } else {
              panel.score = '';
            }
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