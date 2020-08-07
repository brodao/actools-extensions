import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import { readdirSync } from 'fs-extra';
// @ts-ignore
import merge from 'lodash/merge';
import Minipass from 'minipass';
import ora from 'ora';
import * as path from 'path';

import Logger from './logger';

// @ts-ignore

/**
 * Extract a template wizard to a given file path and clean up any properties left over from npm to
 * prepare it for usage.
 */
export async function extractAndPrepareWizardAsync(projectRoot: string) {
  const projectName = path.basename(projectRoot);

  const config = {
    name: projectName,
    expo: {
      name: projectName,
      slug: projectName,
    },
  };

  let appFile = new JsonFile(path.join(projectRoot, 'app.json'));
  let appJson = merge(await appFile.readAsync(), config);
  await appFile.writeAsync(appJson);

  let packageFile = new JsonFile(path.join(projectRoot, 'package.json'));
  let packageJson = await packageFile.readAsync();
  // Adding `private` stops npm from complaining about missing `name` and `version` fields.
  // We don't add a `name` field because it also exists in `app.json`.
  packageJson = { ...packageJson, private: true };
  // These are metadata fields related to the template package, let's remove them from the package.json.
  delete packageJson.name;
  delete packageJson.version;
  delete packageJson.description;
  delete packageJson.tags;
  delete packageJson.repository;

  await packageFile.writeAsync(packageJson);

  return projectRoot;
}

export function getConflictsForDirectory(projectRoot: string): string[] {
  return readdirSync(projectRoot).filter((file: string) => !/\.iml$/.test(file));
}

export function logWizardtReady({ cdPath, wizard }: { cdPath: string; wizard: string }) {
  Logger.nested(chalk.bold(`✅ Seu fonte essta pronto!`));
  Logger.newLine();

  // empty string if project was created in current directory
  if (cdPath) {
    Logger.nested(`Ela foi gerado em ${cdPath} usando o assistente ${wizard}.`);
    Logger.newLine();
    Logger.nested(`- ${chalk.bold('cd ' + cdPath)}`);
  }
}

function sanitizedName(name: string) {
  return name
    .replace(/[\W_]+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
