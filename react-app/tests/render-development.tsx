/** Exercise Motion's browser-only development guard without opening a socket.
 * This is a render check, not a DOM, layout or browser interaction test.
 */
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../src/state/AppContext';
import { localCatalogueService } from '../src/data/service';
import { InteractionProvider } from '../src/components/Interactions';
import { Home } from '../src/pages/Home';
import { CarpetStudio } from '../src/pages/CarpetStudio';
import ScrollReveal from '../src/components/ScrollReveal';

assert.equal(process.env.NODE_ENV, 'development');
const content = await localCatalogueService.loadContent();
// Imports above initialize in the server environment. A minimal window enables
// the same strict-provider invariant that SSR normally skips. No DOM is mocked.
Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
try {
  for (const [path, page] of [['/', <Home />], ['/carpet-studio', <CarpetStudio />]] as const) {
    const html = renderToStaticMarkup(<InteractionProvider><MemoryRouter initialEntries={[path]}><AppProvider content={content}>{page}</AppProvider></MemoryRouter></InteractionProvider>);
    assert.match(html, /<img[^>]+src="\/assets\//, `${path} includes its photographs`);
    assert.doesNotMatch(html, /<img[^>]+style="[^"]*opacity:0(?:;|")/, `${path} must not hide initial images behind an animation`);
    console.log(`PASS development render and visible image markup: ${path}`);
  }
  assert.doesNotThrow(() => renderToStaticMarkup(<InteractionProvider><ScrollReveal as="article">Room details</ScrollReveal></InteractionProvider>));
  console.log('PASS reusable reveal is compatible with the strict Motion provider');
} finally {
  Reflect.deleteProperty(globalThis, 'window');
  if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
  else Reflect.deleteProperty(globalThis, 'localStorage');
}
