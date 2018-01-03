import { buildLogger } from "log-factory";

const logger = buildLogger();

/**
 * if the stdout doesnt start with '{', rm the gunk before the json starts.
 * @param stdout
 */
export function parseJson(stdout: string): any {

  try {
    const trimmed = stdout.trim();
    const openBraceIndex = trimmed.indexOf('{');
    if (openBraceIndex === 0) {
      return JSON.parse(stdout);
    } else {
      const gunkRemoved = trimmed.substring(openBraceIndex);
      const out = JSON.parse(gunkRemoved);
      return out;
    }
  }
  catch (e) {
    logger.error(`[parseJson] failed: ${e.message}`);
    throw e;
  }
}
