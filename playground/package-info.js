let logFactory = require('../lib/log-factory');

logFactory.init({ default: 'silly' });

let info = require('../lib/package-info').info;
let github = require('../lib/package-info/github');

let key = process.argv[2];
let value = process.argv[3];

// github.default.view({ key: key, value: value.trim() }, 'dependencies')
//   .then(r => console.log("> ", r))
//   .catch(e => {
//     console.error('EEEE');
//     console.error(e)
//   });

info({ key: key, value: value.trim() }, 'dependencies', process.cwd())
  .then(r => console.log("> ", r))
  .catch(e => {
    console.error(" >> Error ");
    console.error(e)
  });
