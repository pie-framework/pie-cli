import * as Ajv from 'ajv';
import * as _ from 'lodash';

import { existsSync, readJsonSync } from 'fs-extra';

import { PiePackage } from '../elements';
import { RawConfig } from '../index';
import { buildLogger } from 'log-factory';
import { join } from 'path';
import schema from './config-schema';

const logger = buildLogger();

const ajv = new Ajv();

const validateFn: Ajv.ValidateFunction = ajv.compile(schema);

type SUCCESSFUL = 'yes' | 'no' | 'n/a';

interface ConfigValidation {
  successful: SUCCESSFUL;
}

class MissingSchema implements ConfigValidation {
  public successful: SUCCESSFUL = 'n/a';
}

class BrokenSchema implements ConfigValidation {
  public successful: SUCCESSFUL = 'n/a';
}

class CompletedConfigValidation implements ConfigValidation {
  readonly successful: SUCCESSFUL;
  constructor(readonly id: string, readonly errors: Ajv.ErrorObject[]) {
    this.errors = errors || [];
    this.successful = this.errors.length === 0 ? 'yes' : 'no';
  }
}

const validatePieConfig = (schemaPath: string, data: any): ConfigValidation => {
  logger.debug('[validatePieConfig] path: ', schemaPath);
  logger.silly('[validatePieConfig] data: ', data);

  if (!schemaPath || !existsSync(schemaPath)) {
    logger.info('[validatePieConfig] missing schema: ', schemaPath);
    return new MissingSchema();
  }

  logger.silly('[validatePieConfig] found schema: ', schemaPath);

  const schema = readJsonSync(schemaPath, { throws: false } as any);

  if (!schema) {
    return new BrokenSchema();
  }

  const validate: Ajv.ValidateFunction = ajv.compile(schema);
  validate(data);
  logger.silly(`validate: ${schemaPath}, errors: ${validate.errors}`);
  return new CompletedConfigValidation(data.id, validate.errors);
};

class ValidationResult {
  constructor(readonly mainErrors: Ajv.ErrorObject[],
    readonly configValidations: ConfigValidation[]) {
    this.mainErrors = mainErrors || [];
  }

  get valid(): boolean {
    const hasFailingConfigValidations = _.some(this.configValidations, cv => {
      return cv.successful === 'no';
    });
    return this.mainErrors.length === 0 && !hasFailingConfigValidations;
  }

  get failingConfigValidations(): ConfigValidation[] {
    return _.filter(this.configValidations, cv => {
      return cv.successful === 'no';
    });
  }
}

/**
 * TODO: For all pie libs referenced in the config
 * Try to find a schema for it and then validate that node against the schema
 */
export function validate(config: RawConfig, piePackages: PiePackage[]): ValidationResult {

  const rawValid: boolean = validateFn(config) as boolean;

  const configValidations = rawValid ? _(config.models).map(m => {
    logger.silly('[configValidations] element: ', m.element);
    const pkg = _.find(piePackages, p => m.element === p.key);

    if (!pkg) {
      return undefined;
    }

    const configJson = join(pkg.schemasDir, 'config.json');

    const out = validatePieConfig(configJson, m);

    if (out instanceof MissingSchema) {
      logger.silly(`missing schema for: ${m.element}`);
    }

    return out;
  }).compact().value() : [];

  return new ValidationResult(validateFn.errors, configValidations);
}
