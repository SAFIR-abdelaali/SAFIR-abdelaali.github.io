import { renderToString } from 'react-dom/server';
import { App } from './App';
import { LANGS, dirFor, messages, pathFor, type Lang } from './i18n';

export { LANGS, dirFor, messages, pathFor };
export const render = (lang: Lang) => renderToString(<App lang={lang} />);
