import Ajv from 'ajv';
import _ from 'lodash';
import { buildLogger } from '../log-factory';

const logger = buildLogger();

const schema = {
  title: 'config.json',
  description: 'The schema for a question config',
  type: 'object',
  properties: {
    pies: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          pie: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              },
              version: {
                type: 'string'
              }
            },
            required: [
              'name',
              'version'
            ]
          }
        },
        required: [
          'pie', 'id'
        ]
      }
    }
  },
  required: [
    'pies'
  ]
};

const ajv = new Ajv();

const validateFn = ajv.compile(schema);

/**
 * A cache of schema validation functions
 */
const schemaValidators = {};

function emptyValidate() {
  return true;
}

emptyValidate.errors = [];

function validatePie(loadSchema, obj) {
  logger.silly('[validatePie]', obj);
  let name = obj.pie.name;
  if (!schemaValidators[name]) {
    let schema = loadSchema(name);
    schemaValidators[name] = schema ? ajv.compile(schema) : emptyValidate;
  }
  let valid = schemaValidators[name](obj);
  return {
    valid: valid,
    errors: schemaValidators[name].errors,
    id: obj.id
  }
}

/** 
 * TODO: For all pie libs referenced in the config
 * Try to find a schema for it and then validate that node against the schema
 */
export function validate(config, loadSchema) {

  loadSchema = loadSchema || (() => null);

  let baseValid = validateFn(config);

  if (baseValid) {
    let pieValidations = _.map(config.pies, validatePie.bind(null, loadSchema));
    let pieValidationsAllValid = _.filter(pieValidations, v => !v.valid).length === 0;
    let valid = baseValid && pieValidationsAllValid;

    logger.silly(`[validate] baseValid: ${baseValid}`);
    logger.silly(`[validate] pieValidationsAllValid: ${pieValidationsAllValid}`);

    return {
      valid: valid,
      errors: validateFn.errors || [],
      pies: pieValidations
    }
  } else {
    return {
      valid: false,
      errors: validateFn.errors
    }
  }
}