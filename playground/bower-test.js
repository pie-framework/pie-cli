let b = require('../lib/apps/info/bower');

b.install(__dirname, ['lodash'])
  .then(r => {
    console.log(r);
  });