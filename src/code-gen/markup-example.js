import jsesc from 'jsesc';
import fs from 'fs-extra';
import path from 'path';

let mkExampleMarkup = (markup, model) => `
<!doctype html>
<html>
  <head>
    <script src="bundle.js" type="text/javascript"></script>
    <script src="controller-map-bundle.js" type="text/javascript"></script>
    <script type="text/javascript">

      document.addEventListener('DOMContentLoaded', function(){

        env = {mode: 'gather'};
        model = ${jsesc(model)};
        session = [];
        controller = new pie.ClientSideController(model, pie.controllerMap);
        var player = document.querySelector('pie-player');

        player.addEventListener('pie-player-ready', function(event){
          player.controller = new pie.ClientSideController(model.pies, pie.controllerMap);
          player.env = env;
          player.session = session;
        });
      });
    </script>
  </head>
  <body>
    <pie-player>
    ${markup}
    </pie-player>
  </body>
</html>
`;

export default function(root, srcFile, resultName){
  let playerMarkup = fs.readFileSync(path.join(root, srcFile), {encoding: 'utf8'});
  let model = fs.readJsonSync(path.join(root, 'config.json'));
  let example = mkExampleMarkup(playerMarkup, model);
  let outpath = path.join(root, resultName);
  fs.writeFileSync(outpath, example, {encoding: 'utf8'});
  return Promise.resolve(outpath);
}