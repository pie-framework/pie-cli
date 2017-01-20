/** 
 * The default pie cli configuration object.
 * This can be overridden by adding a `pie.config.json` in the target dir.
 * Or by using `--config path/to/config/json`.
 * 
 * NOTE: Not going to add this to the cli docs for now as the only options that may be changed 
 * are only really for those developing pie-cli or the listed dependencies below.
 */
export default {
  app: {
    dependencies: {
      'pie-player': '~2.1.0',
      'pie-controller': '~2.0.0',
      'pie-control-panel': '~1.3.0'
    }
  }
}
