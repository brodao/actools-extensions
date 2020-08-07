/**
 * Inspired by create-next-app
 */
import JsonFile, { JSONObject } from '@expo/json-file';
import chalk from 'chalk';
import fs from 'fs';
import got from 'got';
import path from 'path';
import prompts from 'prompts';
import { Stream } from 'stream';
import tar from 'tar';
import terminalLink from 'terminal-link';
import { promisify } from 'util';
import log from './logger';

// @ts-ignore
const pipeline = promisify(Stream.pipeline);

export type RepoInfo = {
  username: string;
  name: string;
  branch: string;
  filePath: string;
};

async function isUrlOk(url: string): Promise<boolean> {
  const res = await got(url).catch((e) => e);
  return res.statusCode === 200;
}

export async function getRepoInfo(url: any, wizardPath?: string): Promise<RepoInfo | undefined> {
  log.verbose(`executando getRepoInfo ${url}`);
  const [protocol, username, name, t, _branch, ...file] = url.pathname.split('/');
  const filePath = wizardPath ? wizardPath.replace(/^\//, '') : file.join('/');

  // https://github.com/:username/:my-cool-example-repo-name.
  log.verbose(`${username}, ${name}, ${t}, ${_branch}, ${file}`);
  log.verbose(t);

  if (typeof t !== 'undefined') {
    //`https://api.github.com/repos/${username}/${name}`
    log.verbose('vou executar got');
    const infoResponse = got(url)
      .catch((e) => {
        log.error(e);
      })
      .then((infoResponse: any) => {
        log.verbose('terminei got');
        if (infoResponse) {
          log.verbose(JSON.stringify(infoResponse));
          if (infoResponse.statusCode !== 200) {
            return infoResponse;
          }
          const info = JSON.parse(infoResponse.body);
          log.verbose(info);
          return { username, name, branch: info['default_branch'], filePath };
        } else {
          log.verbose('*** not infoResponse ***');
        }
      });

    const x = await Promise.resolve(infoResponse);
    log.verbose(x);
  }

  // If examplePath is available, the branch name takes the entire path
  console.log('branch');
  const branch = wizardPath
    ? `${_branch}/${file.join('/')}`.replace(new RegExp(`/${filePath}|/$`), '')
    : _branch;
  console.log(branch);

  if (username && name && branch && t === 'tree') {
    return { username, name, branch, filePath };
  }

  console.log('***** não achei ****');

  return undefined;
}

export function hasRepo({ username, name, branch, filePath }: RepoInfo) {
  const contentsUrl = `https://api.github.com/repos/${username}/${name}/contents`;
  const packagePath = `${filePath ? `/${filePath}` : ''}/package.json`;

  return isUrlOk(contentsUrl + packagePath + `?ref=${branch}`);
}

function hasWizard(name: string): Promise<boolean> {
  return isUrlOk(
    `https://api.github.com/repos/expo/examples/contents/${encodeURIComponent(name)}/package.json`
  );
}

export function downloadAndExtractRepoAsync(
  root: string,
  { username, name, branch, filePath }: RepoInfo
): Promise<void> {
  const strip = filePath ? filePath.split('/').length + 1 : 1;
  return pipeline(
    got.stream(`https://codeload.github.com/${username}/${name}/tar.gz/${branch}`),
    tar.extract({ cwd: root, strip }, [`${name}-${branch}${filePath ? `/${filePath}` : ''}`])
  );
}

function downloadAndExtractWizardAsync(root: string, name: string): Promise<void> {
  return pipeline(
    got.stream('https://codeload.github.com/expo/examples/tar.gz/master'),
    tar.extract({ cwd: root, strip: 2 }, [`examples-master/${name}`])
  );
}

async function listAsync(): Promise<any> {
  const res = await got('https://api.github.com/repos/expo/examples/contents');
  const results = JSON.parse(res.body);
  return results.filter(({ name, type }: any) => type === 'dir' && !name?.startsWith('.'));
}
