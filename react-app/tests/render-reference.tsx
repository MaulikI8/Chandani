import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { AppProvider } from '../src/state/AppContext';
import { App } from '../src/App';
import { localCatalogueService } from '../src/data/service';
import { TryRoomDialog } from '../src/components/TryRoomDialog';
import type { RoomId } from '../src/data/types';
import { InteractionProvider } from '../src/components/Interactions';

const content = await localCatalogueService.loadContent();
mkdirSync('test-results/markup', { recursive: true });
for (const [name, path] of [['home', '/'], ['studio', '/carpet-studio'], ['bedroom', '/?room=bedroom&piece=wardrobe'], ['carpets', '/?category=carpets']]) {
  const html = renderToStaticMarkup(<InteractionProvider><MemoryRouter initialEntries={[path]}><AppProvider content={content}><App /></AppProvider></MemoryRouter></InteractionProvider>);
  writeFileSync(`test-results/markup/${name}.html`, html);
  assert.doesNotMatch(html, /iframe|data:image/);
  assert.match(html, /chandani/);
  if (name === 'bedroom') assert.match(html, /scene exploring/);
  if (name === 'carpets') assert.match(html, />3 pieces</);
  console.log(`Rendered React route: ${path}`);
}
for (const [name, room, item] of [['try-sofa', 'living', 'sofa'], ['try-kitchen', 'kitchen', 'kitchen'], ['try-carpet', 'living', 'carpet']] as [string, RoomId, string][]) {
  const html = renderToStaticMarkup(<InteractionProvider><MemoryRouter><AppProvider content={content}><TryRoomDialog initial={{ room, item }} /></AppProvider></MemoryRouter></InteractionProvider>);
  writeFileSync(`test-results/markup/${name}.html`, html);
}
