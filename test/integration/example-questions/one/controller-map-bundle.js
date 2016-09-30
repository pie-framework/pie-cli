
  (function(root){
    root.pie = root.pie || {};
    root.pie.controllerMap = root.pie.controllerMap || {};
    
root.pie.controllerMap['hello-world'] = {};
(function(exports){
  'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.model = model;
function model(ids, session, env) {
  return Promise.resolve({ value: 'tada!' });
}
})(root.pie.controllerMap['hello-world'])

  })(this);
  