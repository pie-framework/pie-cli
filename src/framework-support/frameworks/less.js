export function support(name){
  if(name == 'less'){
    return {
      npmDependencies: {},
      webpackLoaders: () => []
    }
  }
}