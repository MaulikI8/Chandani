import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AppProvider } from './state/AppContext';
import { localCatalogueService } from './data/service';
import './enhancements.css';
import { InteractionProvider } from './components/Interactions';

const root = createRoot(document.getElementById('root')!);
localCatalogueService.loadContent().then(content => {
  root.render(<StrictMode><InteractionProvider><BrowserRouter><AppProvider content={content}><App /></AppProvider></BrowserRouter></InteractionProvider></StrictMode>);
}).catch(() => {
  root.render(<main className="section"><h1>The collection couldn’t load.</h1><p>Please reload to try again.</p><button className="button" onClick={() => location.reload()}>Reload</button></main>);
});
