import winston from 'winston';
import path from 'path';
import _ from 'lodash';
import fs from 'fs-extra';

let config = {
  'default': 'info'
};

export let init = (log) => {
  if (!log) {
    return;
  }
  if (isLogLevel(log)) {
    setDefaultLevel(log);
  } else {
    try {
      let config = JSON.parse(log);
      setConfig(config);
    } catch (e) {
      if (fs.existsSync(log)) {
        setConfigFromFile(log);
      } else {
        console.error('can not configure logging using cli param value: ' + argv.log);
      }
    }
  }
};

function addLogger(label, level) {

  level = level ? level : config['default'] || 'info';
  
  let cfg = {
    console: {
      colorize: true,
      label: label,
      level: level
    }
  };

  if (winston.loggers.has(label)) {
    let logger = winston.loggers.get(label);
    logger.configure(cfg);
    return logger;
  } else {


    var logger = winston.loggers.add(label, cfg);
    logger.cli();
    return logger;
  }
}

export let isLogLevel = (l) => _.includes(['error', 'warn', 'info', 'verbose', 'debug', 'silly'], l);


export let setDefaultLevel = (l) => {
  config = config || {};
  config['default'] = l;
};

export let setConfigFromFile = (configPath)  => {
  var cfg = fs.readJsonSync(configPath);
  console.log(cfg);
  setConfig(cfg);
};

export let setConfig =  (cfg)  => {
  config = cfg;
  _.forIn(cfg, (value, key) => {
    addLogger(key, value);
  });
};

export let getLogger = (id)  => {
  var existing = winston.loggers.has(id);

  if (existing) {
    return winston.loggers.get(id);
  } else {
    return addLogger(id);
  }
};

/** get a file logger */
export let fileLogger = (filename) => {
  var label;
  var parsed = path.parse(filename);

  if (parsed.name === 'index') {
    label = path.basename(parsed.dir);
  } else {
    label = parsed.name;
  }
  return getLogger(label);
}

