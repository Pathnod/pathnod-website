import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from '../src/app/App';
import type { Page } from '../src/app/routes';

const distDir = path.resolve('dist');
const template = await readFile(path.join(distDir, 'index.html'), 'utf8');

const pages: { page: Page; route: string; title: string; description: string }[] = [
  {
    page: 'home', route: '', title: 'Pathnod — Trust what is on the ground',
    description: 'Pathnod is building independent, privacy-conscious observations for physical DePIN infrastructure.',
  },
  {
    page: 'beta', route: 'beta', title: 'Join the beta waitlist — Pathnod',
    description: 'Join the Pathnod beta waitlist to help test independent observations for physical networks.',
  },
  {
    page: 'operators', route: 'operators', title: 'For network operators — Pathnod',
    description: 'Speak with the Pathnod team about device presence and verification challenges in your DePIN network.',
  },
  {
    page: 'thanks', route: 'thanks', title: 'Thank you — Pathnod',
    description: 'Thank you for your interest in Pathnod.',
  },
];

for (const { page, route, title, description } of pages) {
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
    .replace('<div id="root"></div>', `<div id="root">${renderToString(React.createElement(App, { page }))}</div>`);
  const directory = path.join(distDir, route);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
}
