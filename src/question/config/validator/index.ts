import * as Ajv from 'ajv';

import { RawConfig } from '../index';
import schema from './config-schema';

const ajv = new Ajv();

const validateFn: Ajv.ValidateFunction = ajv.compile(schema);

class ValidationResult {
  constructor(readonly mainErrors: Ajv.ErrorObject[]) {
    this.mainErrors = mainErrors || [];
  }

  get valid(): boolean {
    return this.mainErrors.length === 0;
  }
}

/**
 * Validate the root level config.json that defines the pie item.
 */
export function validateConfig(config: RawConfig): ValidationResult {
  validateFn(config);
  return new ValidationResult(validateFn.errors);
}

/**
 * TODO: Integrate validation of pie models using the schemas they provide if present.
 * This can only happen once we have schemas available from installed pies.
 * When:
 * 1. once after installation
 * 2. if a model changes in the config.json after installation
 * @param models
 */
export function validateModels(models: any[]): any[] {
  throw new Error('todo..');
}
