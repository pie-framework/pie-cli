export function support(name){
  if(name == 'vue'){
    return {
      npmDependencies: {},
      webpackLoaders: () => []
    }
  }
}