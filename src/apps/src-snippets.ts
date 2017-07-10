import { PieTarget } from '../install';
import { stripMargin } from '../string-utils';

function toKeyMap(acc, pt: PieTarget) {
  acc[pt.pie] = pt.target;
  return acc;
}

export function targetsToKeyMap(targets: PieTarget[]) {
  return targets.reduce(toKeyMap, {});
}

export function sockJs() {
  return stripMargin`
  |function (sockPath){
  |
  |  let sock = new SockJS(sockPath);
  |
  |  sock.onopen = function() {
  |    console.log('sock is open');
  |  };
  |
  |  function tryToParse(d){
  |    try {
  |     return JSON.parse(d);
  |    } catch(e){
  |      return null;
  |    }
  |  }
  |
  |  sock.onmessage = function(e) {
  |    console.log('sock message', e.data);
  |    let dataObj = tryToParse(e.data);
  |    if(dataObj.type === 'reload'){
  |      window.location.reload(false);
  |    } else if(dataObj.type == 'error'){
  |      //TODO - render the errors in the UI?
  |      alert('webpack errors have occured - check the logs');
  |    }
  |  };
  |
  |  sock.onclose = function() {
  |    console.log('sock is closed');
  |  };
  |}
`;
}

export function controllerDependency(element: string, moduleId: string) {
  return `controllers['${element}'] = require('${moduleId}');`;
}
