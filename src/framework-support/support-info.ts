import { Rule } from 'webpack';

export { Rule }

export type SupportInfo = {
  npmDependencies: { [key: string]: string },
  externals?: {
    js?: string[],
    css?: string[]
  },
  rules: Rule[];
}