require("babel-register")({
  sourceMaps: true
});

const logFactory = require('../src/log-factory');
logFactory.init(process.env.LOG_LEVEL || 'info'); 
