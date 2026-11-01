import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { Header, Footer, SiteLink } from './components/Navigation';
import { Home } from './pages/Home';
import { CarpetStudio } from './pages/CarpetStudio';
import { ProductPage } from './pages/ProductPage';
import { AtelierPage } from './pages/AtelierPage';
import { Drawer } from './components/Drawer';
import { TryRoomDialog } from './components/TryRoomDialog';
import { useApp } from './state/AppContext';
import { Toaster } from 'sonner';
import { useMotionPreference } from './hooks/useMotionPreference';
import './toast.css';

function LegacyRedirect({ path }: { path: string }) {
  const location = useLocation();
  return <Navigate replace to={`${path}${location.search}${location.hash}`} />;
}
export function App() {
  const { panel, tryEntry, toastMessage, setPanel } = useApp();
  const reducedMotion = useMotionPreference();
  const modalOpen = !!panel || !!tryEntry;
  const location = useLocation();
  const lastScrollTarget = useRef('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (modalOpen) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target?.isContentEditable) return;

      if ((event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key === 'k')) && !event.shiftKey) {
        event.preventDefault();
        setPanel({ kind: 'search' });
      } else if ((event.key === 's' || event.key === 'S') && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setPanel({ kind: 'shortlist' });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, setPanel]);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (reducedMotion || modalOpen) return;
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
      infinite: false,
    });
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reducedMotion, modalOpen]);

  useEffect(() => {
    if (location.pathname === '/carpet-studio') {
      document.title = 'Chandani · The carpet studio';
    } else if (location.pathname === '/atelier') {
      document.title = 'Chandani · The Atelier Story';
    } else if (location.pathname.startsWith('/product/')) {
      const prodId = location.pathname.split('/')[2];
      document.title = prodId ? `Chandani · ${prodId.charAt(0).toUpperCase() + prodId.slice(1)}` : 'Chandani · Collection';
    } else {
      document.title = 'Chandani · Furniture, carpets & interiors';
    }
  }, [location.pathname]);
  useEffect(() => {
    const address = location.pathname + location.hash;
    const changed = lastScrollTarget.current !== address;
    lastScrollTarget.current = address;
    if (!location.hash || (!changed && !location.state?.scrollHash)) return;
    const target = document.getElementById(location.hash.slice(1));
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }));
  }, [location.pathname, location.hash, location.key]);
  useEffect(() => { if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);
  return <><a className="skip" href="#main">Skip to content</a><Header /><main id="main" tabIndex={-1}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/carpet-studio" element={<CarpetStudio />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/atelier" element={<AtelierPage />} />
      <Route path="/index.html" element={<LegacyRedirect path="/" />} />
      <Route path="/atelier.html" element={<LegacyRedirect path="/carpet-studio" />} />
      <Route path="*" element={<section className="section"><h1>Let’s find your way home.</h1><SiteLink className="text-link" to="/">Explore Chandani →</SiteLink></section>} />
    </Routes>
  </main><Footer />
    {panel && <Drawer />}
    {tryEntry && <TryRoomDialog initial={tryEntry} />}
    <Toaster
      position="bottom-right"
      toastOptions={{
        className: 'chandani-toast',
      }}
      closeButton
    />
    <div className={`toast${toastMessage ? ' visible' : ''}`} role="status" aria-live="polite">{toastMessage}</div>
    {showScrollTop && (
      <button
        type="button"
        className="scroll-to-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })}
        aria-label="Scroll to top of page"
      >
        ↑
      </button>
    )}
  </>;
}



