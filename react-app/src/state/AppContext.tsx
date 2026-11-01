import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CatalogueContent, CarpetColour, RoomId } from '../data/types';
import { configurationKey, savedConfigurationKey, restoreConfiguration, selectVariant } from './configuration';
import type { SlotId } from '../data/configuration';
import { readStored, validShortlist, writeStored } from './storage';
import { newEnquiry, type EnquiryState } from './enquiry';
import { toast } from 'sonner';

type Panel = { kind: 'product'; id: string } | { kind: 'search' | 'shortlist' | 'menu' | 'enquiry' | 'draft' | 'atelier' } | null;
export type TryEntry = { room: RoomId; item: string };
const shortlistKey = 'chandani-home-shortlist';

function useApplication(content: CatalogueContent) {
  const navigate = useNavigate();
  const location = useLocation();
  const products = useMemo(() => Object.fromEntries(content.products.map(p => [p.id, p])), [content]);
  const [saved, setSaved] = useState(() => {
    const params = new URLSearchParams(location.search);
    const source = params.has('saved') ? params.get('saved')!.split(',') : readStored(shortlistKey) ?? readStored('chandani-shortlist-v2');
    return validShortlist(source, Object.keys(products));
  });
  const [panel, setPanel] = useState<Panel>(null);
  const [tryEntry, setTryEntry] = useState<TryEntry | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [configuration, setConfiguration] = useState(() => restoreConfiguration(readStored(configurationKey)));
  const [savedConfiguration, setSavedConfiguration] = useState(() => {
    const value = readStored(savedConfigurationKey);
    return value && typeof value === 'object' && 'version' in value && value.version === 1 ? restoreConfiguration(value) : null;
  });
  const [enquiry, setEnquiry] = useState<EnquiryState>(() => newEnquiry('Whole home', []));
  const [enquiryHistory, setEnquiryHistory] = useState<Record<string, EnquiryState>>({});

  useEffect(() => { writeStored(shortlistKey, saved); }, [saved]);
  useEffect(() => { writeStored(configurationKey, configuration); }, [configuration]);
  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(''), 2600);
    return () => clearTimeout(timer);
  }, [toastMessage]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === shortlistKey) setSaved(validShortlist(readStored(shortlistKey), Object.keys(products)));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [products]);
  const productParam = new URLSearchParams(location.search).get('product');
  useEffect(() => {
    if (productParam && Object.hasOwn(products, productParam)) setPanel({ kind: 'product', id: productParam });
    else setPanel(previous => previous?.kind === 'product' ? null : previous);
  }, [productParam, products]);

  function query(values: Record<string, string | null>, hash?: string, replace = false) {
    const params = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(values)) value === null ? params.delete(key) : params.set(key, value);
    navigate({ pathname: location.pathname, search: params.toString(), hash: hash ?? location.hash }, { replace, state: { scrollHash: hash !== undefined } });
  }
  function clearProductLink() {
    if (productParam) query({ product: null }, undefined, true);
  }
  function closePanel() { setPanel(null); clearProductLink(); }
  function openPanel(kind: 'menu' | 'search' | 'shortlist' | 'atelier') { clearProductLink(); setPanel({ kind }); }
  function openProduct(id: string) {
    if (!Object.hasOwn(products, id)) return;
    setPanel({ kind: 'product', id });
    query({ product: id });
  }
  function toggleSave(id: string) {
    if (!Object.hasOwn(products, id)) return;
    const isSaved = saved.includes(id);
    const product = products[id];
    setSaved(previous => isSaved ? previous.filter(x => x !== id) : [...previous, id]);
    const message = isSaved ? 'Removed from your shortlist' : 'Saved to your shortlist';
    setToastMessage(message);
    if (isSaved) {
      toast('Removed from shortlist', {
        description: product ? `${product.name} removed from your saved pieces.` : undefined,
        action: {
          label: 'Undo',
          onClick: () => {
            setSaved(prev => (prev.includes(id) ? prev : [...prev, id]));
            setToastMessage('Saved to your shortlist');
          },
        },
      });
    } else {
      toast('Saved to your shortlist', {
        description: product ? `${product.name} saved in this browser.` : undefined,
        action: {
          label: 'View shortlist',
          onClick: () => setPanel({ kind: 'shortlist' }),
        },
      });
    }
  }
  function chooseVariant(room: RoomId, slot: SlotId, variant: string) {
    setConfiguration(previous => selectVariant(previous, room, slot, variant));
  }
  function saveConfiguration() {
    const snapshot = structuredClone(configuration);
    if (writeStored(savedConfigurationKey, snapshot)) {
      setSavedConfiguration(snapshot);
      setToastMessage('Room selections saved in this browser');
      toast.success('Room selections saved', {
        description: 'Stored in this browser for your next visit.',
      });
    } else {
      setToastMessage('Browser storage is unavailable. Your selections remain for this visit.');
      toast.error('Browser storage unavailable', {
        description: 'Your selections remain active for this visit.',
      });
    }
  }
  function restoreSavedConfiguration() {
    if (!savedConfiguration) return;
    setConfiguration(structuredClone(savedConfiguration));
    setToastMessage('Saved room selections restored');
    toast('Saved room selections restored', {
      description: 'Your saved room design has been reloaded.',
    });
  }
  function openTry(productId?: string, room?: RoomId) {
    const requestedRoom = new URLSearchParams(location.search).get('room');
    const targetRoom = room ?? (requestedRoom && Object.hasOwn(content.comparisons, requestedRoom) ? requestedRoom as RoomId : 'living');
    let entry: TryEntry = { room: targetRoom, item: content.comparisons[targetRoom].items[0].id };
    for (const [key, value] of Object.entries(content.comparisons)) {
      const match = productId && value.items.find(item => item.product === productId || (item.colours && ['clay', 'chalk', 'ink'].includes(productId)));
      if (match) {
        entry = { room: key as RoomId, item: match.id };
        if (match.colours) chooseVariant('living', 'carpet', productId as CarpetColour);
        break;
      }
    }
    setTryEntry(entry);
  }
  function openEnquiry(interest: string, clientType?: 'private' | 'trade' | 'swatch', extraNotes?: string) {
    const selected = interest === 'My shortlist' ? content.products.filter(p => saved.includes(p.id)) : content.products.filter(p => p.name === interest);
    const history = { ...enquiryHistory, [enquiry.fields.interest]: enquiry };
    setEnquiryHistory(history);
    const previous = history[interest];
    const base = previous ? { ...previous, selected: newEnquiry(interest, selected).selected } : newEnquiry(interest, selected);
    if (clientType) {
      base.fields.clientType = clientType;
    }
    if (extraNotes) {
      base.fields.notes = extraNotes;
    }
    setEnquiry(base);
    clearProductLink();
    setTryEntry(null);
    setPanel({ kind: 'enquiry' });
  }
  function notify(msg: string) {
    setToastMessage(msg);
    toast(msg);
  }
  return { content, products, saved, toggleSave, panel, setPanel, closePanel, openPanel, openProduct,
    tryEntry, setTryEntry, openTry, openEnquiry, enquiry, setEnquiry, query, configuration, chooseVariant,
    saveConfiguration, restoreSavedConfiguration, savedConfiguration, toastMessage, notify };
}
type Application = ReturnType<typeof useApplication>;
const AppContext = createContext<Application | null>(null);
export function AppProvider({ content, children }: { content: CatalogueContent; children: ReactNode }) {
  const app = useApplication(content);
  return <AppContext.Provider value={app}>{children}</AppContext.Provider>;
}
export function useApp() {
  const app = useContext(AppContext);
  if (!app) throw new Error('AppProvider is required');
  return app;
}
