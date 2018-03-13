  `--dir` - the relative path to a directory to use as the pie item root. This should contain `config.json` and `index.html` - default: the current working directory
  `--question-config-file` - the name of the pie data file (can be json or a simple js module eg: `module.exports = {}`) - default: `config.json`
  `--question-markup-file` - the name of layout file - default: `index.html`
  `--question-session-file` - the name of session file - default: `session.(js|json) [optional]`
  `--log-file` - the name of a file to output logging information to - default: not set (no logging)
  `--log-level` - the log level to use can be a level, json string, path to json file - default: 'info'
  `--log-to-console` - if set, logging will go directly to the console. `--log-file` is ignored.