import { PieTarget } from '../install';
import { camelCase } from 'change-case';
import { stripMargin } from '../string-utils';

export function targetsToElements(targets: PieTarget[]) {
  return targets.map(targetToElement).join('\n');
}

export function targetToElement(pt: PieTarget) {
  const clazz = camelCase(pt.target);
  return stripMargin`
  |import ${clazz} from '${pt.target}';
  |customElements.define('${pt.target}', ${clazz});
  |`;
}

function toKeyMap(acc, pt: PieTarget) {
  acc[pt.pie] = pt.target;
  return acc;
};

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

export function controllerDependency(pt: PieTarget) {
  return `controllers['${pt.pie}'] = require('${pt.target}');`;
}
