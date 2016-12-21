import { Viewer, KeyValue } from './index';
import { buildLogger } from '../log-factory';
import * as _ from 'lodash';

const logger = buildLogger();

const toParams = (pattern: KeyValue): any => {
  let [base, ref] = pattern.value.split('#');
  let [owner, repo] = base.split('/');
  repo = repo.indexOf('/') === -1 ? repo : undefined;
  if (repo.includes('..') || owner.includes('..')) {
    return {};
  } else {
    return { owner, repo, ref };
  }
}

export class Github implements Viewer {

  constructor() { }

  match(pattern: KeyValue): boolean {
    try {
      let {owner, repo, ref} = toParams(pattern);
      return owner && repo ? true : false;
    } catch (e) {
      return false;
    }
  }

  view(pattern: KeyValue, property: string): Promise<any | undefined> {

    if (!pattern) {
      return Promise.reject(new Error(`pattern is undefined`));
    }

    if (!property) {
      return Promise.reject(new Error(`property is undefined`));
    }

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

      let safeParse = (s: string): any => {
        try {
          return JSON.parse(s);
        }
        catch (e) {
          return {}
        }
      }

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
          let all = safeParse(result.toString('utf8'));

          if (!_.isString(all.content)) {
            reject(new Error(`github response is missing 'content' property`));
          }

          let pkgString = Buffer.from(all.content, 'base64').toString('utf8');
          logger.silly('pkgString: ', pkgString);
          let parsed = safeParse(pkgString);
          logger.silly('parsed: ', parsed);
          let out = parsed[property];
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
