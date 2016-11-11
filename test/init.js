require("babel-register")({
  sourceMaps: true
});

const logFactory = require('../src/log-factory');
logFactory.init(process.env.LOG_LEVEL || 'info');

global.logCalls = (spy) => {
  if (!spy) {
    return;
  }
  for (var i = 0; i < spy.callCount; i++) {
    console.log('>>> ', spy.getCall(i).args);
  }
}
