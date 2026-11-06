// Turns the client build into one real HTML page per language, so each URL has
// translated content, lang/dir and metadata before any JavaScript runs.
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://safir-abdelaali.github.io';

const { render, messages, LANGS, pathFor, dirFor } = await import(
  pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href
);
const template = readFileSync(join(dist, 'index.html'), 'utf8');

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// GitHub Pages serves one 404.html for every unknown path, whatever its language.
// It sends visitors to the home page of the language in the URL and stays out of search results.
// It leaves out the app bundle, since with JavaScript on the page is already leaving.
const HOMES = JSON.stringify(LANGS.map((l) => [l, pathFor(l)]));
const NOT_FOUND_HEAD = `<meta name="robots" content="noindex" />
    <script>
      location.replace(new Map(${HOMES}).get(location.pathname.split('/')[1]) || '/');
    </script>`;
const APP_BUNDLE = /<script type="module"[^>]*><\/script>\s*/;

const page = (lang, notFound = false) => {
  const m = messages[lang].meta;
  const url = SITE + pathFor(lang);
  const head = notFound ? NOT_FOUND_HEAD : [
    `<meta name="description" content="${attr(m.description)}" />`,
    `<meta property="og:title" content="${attr(m.title)}" />`,
    `<meta property="og:description" content="${attr(m.ogDescription)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE}/assets/my%20pic.png" />`,
    `<link rel="canonical" href="${url}" />`,
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${pathFor(l)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${SITE}/" />`,
  ].join('\n    ');
  return (notFound ? template.replace(APP_BUNDLE, '') : template)
    .replace('<html lang="en" dir="ltr"', `<html lang="${lang}" dir="${dirFor(lang)}"`)
    .replace(/<title>.*?<\/title>/, `<title>${attr(m.title)}</title>`)
    .replace('<!--head-meta-->', head)
    .replace('<!--app-html-->', render(lang));
};

for (const lang of LANGS) {
  const out = join(dist, pathFor(lang), 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page(lang));
  console.log('prerendered', pathFor(lang));
}
writeFileSync(join(dist, '404.html'), page('en', true));
// The first version of the site linked this path, and copies of that link may still be out there.
copyFileSync(join(dist, 'assets', 'cv-en.pdf'), join(dist, 'assets', 'cv.pdf'));
rmSync(join(root, 'dist-ssr'), { recursive: true, force: true });
