
declare module "webpack-dev-middleware" {
  import * as webpackMain from 'webpack';

  namespace webpack {
    interface DevMiddleware {
      (config: webpackMain.Configuration, opts?: any): any
    }
  }

  var webpackDevMiddleware: webpack.DevMiddleware;
  export = webpackDevMiddleware;
}