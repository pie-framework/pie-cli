export type LoaderInfo = {
  test: RegExp,
  loader: string
}

export type SupportInfo = {
  npmDependencies: {[key:string]: string},
  externals?: {
    js?: string[],
    css?: string[]
  },
  webpackLoaders: (string?) => LoaderInfo[] 
}