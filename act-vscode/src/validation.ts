import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import { readdirSync } from 'fs-extra';
// @ts-ignore
import merge from 'lodash/merge';
import Minipass from 'minipass';
import ora from 'ora';
import * as path from 'path';
import fs from 'fs';

import Logger from './logger';

// @ts-ignore

export function validateFolderName(name?: string): string | true {
  if (typeof name !== 'string' || name === '') {
    return 'The folder name can not be empty.';
  }

  if (!/^[a-z0-9.\-_\\:]+$/i.test(name)) {
    return 'The folder name can only contain letters, numbers, points, minus, underline, separators and colon.';
  }

  return true;
}

export function validateFileName(name?: string): string | true {
  if (typeof name !== 'string' || name === '') {
    return 'The file name can not be empty.';
  }

  if (!/^[a-z0-9.\-_]+$/i.test(name)) {
    return 'The file name can only contain letters, numbers, points, minus and underline.';
  }

  return true;
}

export function validateFolder(folder: string, needEmpty: boolean = false): string | true {
  const validationName = validateFolderName(folder);

  if (typeof validationName === 'string') {
    return validationName;
  }

  if (fs.existsSync(folder)) {
    if (needEmpty) {
      const files: string[] = fs.readdirSync(folder);
      if (files.length > 0) {
        return 'Pasta não está vazia';
      }
    }
  } else if (!needEmpty) {
    return 'Pasta não existe';
  }

  return true;
}
