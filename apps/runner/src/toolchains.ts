import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

async function has(cmd: string, args: string[]): Promise<boolean> {
  try {
    await exec(cmd, args, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/** Reports which compilers are installed so the UI can tell the learner what's missing. */
export async function detectToolchains() {
  const [java, cpp] = await Promise.all([has('javac', ['-version']), has('g++', ['--version'])]);
  return { java, cpp };
}
