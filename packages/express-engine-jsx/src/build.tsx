import {
  existsSync,
  readFileSync,
  outputFileSync,
} from 'fs-extra';
import {
  sep,
  resolve,
} from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Config } from '@react-ssr/express';
import Html from './html';
import rollup from './rollup';

const getPagePath = (file: string, config: Config): string => {
  return file.split(sep + config.viewsDir + sep)[1];
};

const build = async (file: string, config: Config, props: any): Promise<string> => {
  const cwd: string = process.cwd();
  const buildDir: string = config.buildDir as string;
  const ssrDir: string = '_react-ssr';
  const pagePath: string = getPagePath(file, config);

  const cache: string = resolve(cwd, buildDir, ssrDir, pagePath.replace('.jsx', '.html'));
  if (existsSync(cache)) {
    return readFileSync(cache).toString();
  }

  const page: string = resolve(cwd, buildDir, ssrDir, pagePath);
  let Page: any;
  let html: string = '<!DOCTYPE html>';

  try {
    Page = require(page);
    Page = Page.default || Page;

    html += renderToString(
      <Html script={pagePath.replace('.jsx', '.js')}>
        <Page {...props} />
      </Html>
    );

    return html;

  } finally {
    await outputFileSync(cache, html);
    await (await rollup(resolve(__dirname, 'client.jsx'), Page, props)).write({
      file: page.replace('.jsx', '.js'),
      format: 'iife',
      name: 'ReactSsrExpress',
    });
  }
};

export default build;
