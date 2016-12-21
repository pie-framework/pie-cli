import { Viewer, KeyValue } from './index';
import { buildLogger } from '../log-factory';

const logger = buildLogger();

const toParams = (pattern: KeyValue): any => {
  let [base, ref] = pattern.value.split('#');
  let [owner, repo] = base.split('/');
  repo = repo.indexOf('/') === -1 ? repo : undefined;
  return { owner, repo, ref };
}

export class Github implements Viewer {

  constructor() { }

  match(pattern: KeyValue): boolean {
    try {
      let {owner, repo, ref} = toParams(pattern);
      return owner && repo;
    } catch (e) {
      return false;
    }
  }

  view(pattern: KeyValue, property: string): Promise<any | undefined> {

    logger.info('[view], pattern: ', pattern, ' property: ', property);

    return new Promise((resolve, reject) => {
      let {owner, repo, ref} = toParams(pattern);

      if (!owner || !repo) {
        logger.error('missing owner or repo in params: ', owner, repo, 'for pattern: ', pattern);
        resolve(undefined);
      }

      const https = require('https');

      let u = `/repos/${owner}/${repo}/contents/package.json`;
      u += ref ? `?ref=${ref}` : '';

      var options = {
        hostname: 'api.github.com',
        port: 443,
        path: u,
        method: 'GET',
        headers: {
          'User-Agent': 'pie-cli'
        }
      };

      let req = https.get(options, (res) => {
        logger.debug('statusCode:', res.statusCode);

        if (res.statusCode !== 200) {
          resolve(undefined);
          return;
        }

        logger.debug('headers:', res.headers);

        let result = new Buffer('', 'utf8');

        res.on('data', (d) => {
          result += d;
        });

        res.on('end', (d) => {
          logger.silly('end: ', result.toString('utf8'));
          let all = JSON.parse(result.toString('utf8'));
          let pkgString = Buffer.from(all.content, 'base64').toString('utf8');
          let data = JSON.parse(pkgString);
          let out = data[property];
          logger.silly('out: ', out);
          resolve(out);
        });
      });

      req.on('error', (e) => {
        resolve(undefined);
      });
    });
  }
}

export default new Github();
