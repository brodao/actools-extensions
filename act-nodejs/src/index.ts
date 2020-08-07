#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { ensureDir, existsSync } from 'fs-extra';
import * as path from 'path';
import prompts from 'prompts';

import * as Wizards from './wizards';
import log from './logger';
import * as Wizard from './wizard';
import {
  validateFolder,
  validateFolderName,
  validateFileName as validateFilename,
} from './validation';
import ora from 'ora';
import { getRepoInfo, RepoInfo, downloadAndExtractRepoAsync } from './repoInfo';
import { URL } from 'url';

const packageJSON = require('../package.json');
const repos = packageJSON['config']['repos'] || {};

let outputFolder: string;
let outputFile: string;

enum ExecCommand {
  'wizard',
  'download',
}
let execCommand: ExecCommand;

const program = new Command(packageJSON.name)
  .version(packageJSON.version)
  .arguments('[command] [options]')
  .usage(`${chalk.magenta('[command]')} [options]`)
  .option('-o, --overwrite', 'sobrescreve se o destino existir', false)
  .option('-v, --verbose', 'detalha a execução', true)
  .option('--no-banner', 'omite a abertura', true)
  .allowUnknownOption(true);

program
  .command('wizard', { isDefault: true })
  .arguments('[filename]')
  .usage(`${chalk.magenta('[filename | fullFilename]')} [options] [global options]`)
  .description('Cria um novo fonte AdvPL com base nas suas escolhas (comando padrão)')
  .action((filename: string) => {
    execCommand = ExecCommand.wizard;
    if (filename) {
      outputFolder = path.dirname(path.resolve(filename)).toString();
      outputFile = path.basename(path.resolve(filename)).toString();
    }
  })
  .option(
    '-w, --wizard [wizard|url]',
    'nome de um assistente ou URL para um repositório do Git que contém assistentes'
  )
  .option(
    '--wizard-path [name|folder]',
    'caminho em um repositório Git ou pasta local, onde os assistentes estão'
  );

program
  .command('download')
  .arguments('[folder]')
  .usage(`${chalk.magenta('[folder]')} [options] [global options]`)
  .description('Transfere os assistentes para uso em ambiente local')
  .action((folder: string) => {
    execCommand = ExecCommand.download;
    if (folder) {
      outputFolder = path.resolve(folder).toString();
      outputFile = '';
    }
  });

// program.on('--help', () => {
//   //  log.showBanner(packageJSON);
// });
console.log("inciando");

program.parse(process.argv);

function verbose(text: string | string[], args?: any) {
  if (program.verbose) {
    log.verbose(text, args);
  }
}

export function logNewSection(title: string) {
  let spinner = ora(chalk.bold(title));
  spinner.start();
  return spinner;
}

async function runAsync(): Promise<void> {
  try {
    if (program.banner) {
      log.showBanner(packageJSON);
    }

    verbose('Linha de comando', process.argv);
    verbose(`Opções de execução [${execCommand}]`, program.opts());

    if (execCommand === ExecCommand.download) {
      await runDownload();
    } else if (execCommand === ExecCommand.wizard) {
      await runWizard();
    } else {
      exitWithError('Comando não reconhecido.');
    }
  } catch (error) {
    await commandDidThrowAsync(error);
  }

  process.exit(0);
}

async function runDownload(): Promise<void> {
  verbose('Resolvendo pasta destino');
  let targetFolder: string = await resolveTargetFolderAsync(outputFolder);
  verbose(`Pasta destino ${targetFolder}`);

  verbose(`Iniciando processo de transferência`);
  let step = logNewSection('Localizando definição de assistentes para transferência.');
  step.start();

  Object.keys(repos).forEach(async (key) => {
    const repo = repos[key];

    step.warn(`Obtendo informações sobre ${chalk.greenBright(repo.label)}`);

    verbose(repo.url);
    verbose(repo.path);

    try {
      const repoInfo: RepoInfo | undefined = await getRepoInfo(new URL(repo.url), repo.path);

      if (repoInfo) {
        step.info(`Informações obtidas ${repoInfo.branch}:${repoInfo.filePath}`);

        if (repoInfo) {
          step.text = chalk.bold(
            `Downloading files from repo ${chalk.cyan(repo.name)}. This might take a moment.`
          );

          await downloadAndExtractRepoAsync(targetFolder, repoInfo);
        } else {
          step.fail('erro ao obter repoInfo');
          // step.text = chalk.bold(
          //   `Downloading files for example ${chalk.cyan(template)}. This might take a moment.`
          // );

          // await downloadAndExtractExampleAsync(projectRoot, template);
        }
      }
    } catch (error) {
      log.error('ERROR');
      log.error(error);
    }
  });

  step.stop();

  verbose(`Processo de transferência finalizado`);
}

async function runWizard(): Promise<void> {
  verbose('Resolvendo pasta destino');
  let targetFolder: string = await resolveTargetFolderAsync(outputFolder);
  verbose(`Pasta destino ${targetFolder}`);

  verbose('Resolvendo arquivo');
  let targetFile: string = await resolveTargetFileAsync(outputFile);
  verbose(`Arquivo ${targetFile}`);

  verbose('Resolvendo assistente');
  let { wizard: resolvedWizard, path: wizardPath } = await resolveWizardAsync(
    program.wizard,
    program.wizardPath
  );
  verbose(`Assistente ${resolvedWizard} caminho: ${wizardPath}`);

  await ensureDir(targetFolder);
  let extractWizardStep = logNewSection(`Localizando definição de assistentes.`);

  try {
    if (resolvedWizard) {
      await Wizards.resolveWizardArgAsync(
        targetFolder,
        extractWizardStep,
        resolvedWizard,
        wizardPath
      );

      await Wizards.appendScriptsAsync(targetFolder);
    } else {
      await Wizard.extractAndPrepareWizardAsync(targetFolder);
    }
    extractWizardStep.succeed('Arquivos de assistentes transferidos e extraídos');
  } catch (e) {
    extractWizardStep.fail('Ocorreu um erro ao transferir e extrair os arquivos de assistentes');

    process.exit(1);
  }

  const cdPath = getChangeDirectoryPath(targetFolder);
  log.newLine();
  Wizard.logWizardtReady({ cdPath, wizard: 'wizard' });
}

function getChangeDirectoryPath(targetFolder: string): string {
  const cdPath = path.relative(process.cwd(), targetFolder);

  if (cdPath.length <= targetFolder.length) {
    return cdPath;
  }
  return targetFolder;
}

// function logNodeInstallWarning(cdPath: string): void {
//   log.newLine();
//   log.nested(`⚠️  Before running your app, make sure you have node modules installed:`);
//   log.nested('');
//   log.nested(`  cd ${cdPath ?? ''}/`);
//   log.nested(`  ${packageManager === 'npm' ? 'npm install' : 'yarn'}`);
//   log.nested('');
// }

runAsync();

function assertValidFilename(filename: string) {
  const validation = validateFilename(filename);

  if (typeof validation === 'string') {
    exitWithError(['Não posso criar um arquivo com esse nome:', chalk.bold(filename), validation]);
  }
}

function assertValidFolder(folderName: string, needEmpty: boolean) {
  let validation = validateFolderName(folderName);

  if (typeof validation === 'string') {
    exitWithError([
      'ASSERT',
      'Não posso criar uma pasta com esse nome:',
      `Pasta ${chalk.bold(folderName)}`,
      validation,
    ]);
  }

  validation = validateFolder(folderName, needEmpty);
  if (typeof validation === 'string') {
    exitWithError([
      'ASSERT',
      'Não posso usar a pasta com esse nome:',
      `Pasta ${chalk.bold(folderName)}`,
      validation,
      'Use --overwrite.',
    ]);
  }
}

async function resolveTargetFolderAsync(input: string): Promise<string> {
  let name = input?.trim();

  if (!name) {
    const { answer } = await prompts({
      type: 'text',
      name: 'answer',
      message: 'Pasta destino?',
      initial: process.cwd(),
      validate: (name) => {
        let validation = validateFolderName(name);
        if (typeof validation === 'string') {
          return validation;
        }

        validation = validateFolder(name, true);
        if (typeof validation === 'string') {
          return validation;
        }

        return true;
      },
    });

    if (typeof answer === 'string') {
      name = answer.trim();
    }
  }

  verbose(`>>> validando ${name}`);

  if (!name) {
    exitWithError('[REQUIRED_FOLDER] Favor informar pasta destino');
  }

  assertValidFolder(name, true);

  await ensureDir(name);

  return name;
}

function exitWithError(args: string | string[], code: number = 1) {
  log.newLine();

  if (typeof args === 'string') {
    log.error(args);
  } else {
    let first: boolean = true;

    args.forEach((line: string) => {
      if (first) {
        log.error(line);
        first = false;
      } else {
        log.gray(`  ${line}`);
      }
    });
  }
  log.error(`(Exit code: ${code})`);
  log.newLine();
  log.nested(`Execute ${chalk.green(`${program.name()} --help`)} para mais informações.`);

  process.exit(code);
}

async function resolveTargetFileAsync(input: string): Promise<string> {
  let name = input?.trim();

  if (!name) {
    const { answer } = await prompts({
      type: 'text',
      name: 'answer',
      message: 'Arquivo?',
      initial: 'new_file.prw',
      validate: (name) => {
        const validation = validateFilename(path.basename(path.resolve(name)));
        if (typeof validation === 'string') {
          return 'Arquivo inválido: ' + validation;
        }

        return true;
      },
    });

    if (typeof answer === 'string') {
      name = answer.trim();
    }
  }

  if (!name) {
    exitWithError('Favor informar arquivo:');
  }

  const fileName = path.basename(path.resolve(name));

  assertValidFilename(fileName);

  return fileName;
}

async function resolveWizardAsync(
  input: string,
  wizardPath: string
): Promise<{ wizard: string; path: string }> {
  let name = input?.trim();
  let pathWizard = wizardPath?.trim();

  if (!name) {
    const answer: string | null = await Wizards.promptAsync(repos);

    if (typeof answer === 'string') {
      name = answer.trim();
    }
  }

  if (!name) {
    exitWithError('Favor informar assistente:');
  }

  return { wizard: name, path: pathWizard };
}

async function commandDidThrowAsync(error: any) {
  log.newLine();
  log.nested(chalk.red(`An unexpected error occurred:`));
  log.nested(error);
  log.newLine();

  process.exit(1);
}
