require('babel-register')({
  sourceMaps: true
});

const logFactory = require('log-factory');
logFactory.init({ console: true, log: process.env.LOG_LEVEL || 'info' });

global.testLogger = logFactory.getLogger('TEST');

global.logSpy = (s) => {
  testLogger.info('logSpy: ', s);
  for (var i = 0; i < s.callCount; i++) {
    global.testLogger.info('call: ', i, ': ', JSON.stringify(s.getCall(i).args));
  }
}
