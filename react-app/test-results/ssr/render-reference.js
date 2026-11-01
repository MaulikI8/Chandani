import { renderToStaticMarkup } from "react-dom/server";
import { Link, MemoryRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createContext, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Toaster, toast } from "sonner";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import Lenis from "lenis";
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m, useAnimationControls, useInView } from "motion/react";
import useEmblaCarousel from "embla-carousel-react";
//#region src/data/configuration.ts
var piece = (id, label, productId, name) => ({
	id,
	label,
	variants: [{
		id: productId,
		productId,
		label: name
	}],
	defaultVariant: productId
});
/** Real sample selections only. No invented sofa models or unsupported removal combinations. */
var roomSlots = {
	living: [
		piece("sofa", "Sofa", "sofa", "Haven / Sofa"),
		{
			id: "carpet",
			label: "Carpet",
			defaultVariant: "chalk",
			variants: [...[
				"clay",
				"chalk",
				"ink"
			].map((id) => ({
				id,
				productId: id,
				label: `Frame / ${id[0].toUpperCase()}${id.slice(1)}`
			})), {
				id: "bare",
				productId: null,
				label: "Bare floor"
			}]
		},
		piece("side-table", "Side table", "side-table", "Plinth / Side table")
	],
	dining: [piece("dining-table", "Dining table", "dining-table", "Arc / Dining table"), piece("dining-chair", "Dining chairs", "dining-chair", "Line / Dining chair")],
	bedroom: [
		piece("bed", "Bed", "bed", "Rest / Upholstered bed"),
		piece("lamp", "Table light", "lamp", "Halo / Table light"),
		piece("wardrobe", "Wardrobe", "wardrobe", "Form / Wardrobe")
	],
	kitchen: [{
		id: "kitchen",
		label: "Kitchen",
		defaultVariant: "concept",
		variants: [{
			id: "concept",
			productId: null,
			label: "Kitchen design concept"
		}]
	}]
};
//#endregion
//#region src/state/configuration.ts
var configurationKey = "chandani-room-configuration-v1";
var savedConfigurationKey = "chandani-saved-room-configuration-v1";
function defaultConfiguration() {
	return {
		version: 1,
		rooms: Object.fromEntries(Object.entries(roomSlots).map(([id, slots]) => [id, Object.fromEntries(slots.map((slot) => [slot.id, slot.defaultVariant]))]))
	};
}
function selectVariant(state, room, slotId, variantId) {
	if (!(roomSlots[room]?.find((s) => s.id === slotId))?.variants.some((v) => v.id === variantId)) return state;
	if (state.rooms[room][slotId] === variantId) return state;
	return {
		...state,
		rooms: {
			...state.rooms,
			[room]: {
				...state.rooms[room],
				[slotId]: variantId
			}
		}
	};
}
/** Validate every saved slot against current content; never trust local storage as catalogue data. */
function restoreConfiguration(value) {
	let result = defaultConfiguration();
	if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("rooms" in value)) return result;
	const rooms = value.rooms;
	if (!rooms || typeof rooms !== "object") return result;
	for (const room of Object.keys(roomSlots)) {
		const selections = rooms[room];
		if (!selections || typeof selections !== "object") continue;
		for (const slot of roomSlots[room]) {
			const variant = selections[slot.id];
			if (typeof variant === "string") result = selectVariant(result, room, slot.id, variant);
		}
	}
	return result;
}
//#endregion
//#region src/state/storage.ts
function readStored(key) {
	if (typeof window === "undefined") return null;
	try {
		return JSON.parse(localStorage.getItem(key) ?? "null");
	} catch {
		return null;
	}
}
function writeStored(key, value) {
	if (typeof window === "undefined") return false;
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}
function validShortlist(value, ids) {
	return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === "string" && ids.includes(id)))] : [];
}
//#endregion
//#region src/state/enquiry.ts
function newEnquiry(interest, selected) {
	return {
		fields: {
			interest,
			name: "",
			contact: "",
			dimensions: "",
			layout: "Not sure yet",
			notes: "",
			clientType: "private"
		},
		selected: selected.map(({ id, name, palette }) => ({
			id,
			name,
			palette
		})),
		message: ""
	};
}
function buildDraft({ fields, selected }) {
	const lines = [
		"Hello Chandani,",
		"",
		`I’m interested in: ${fields.interest}.`
	];
	if (fields.clientType === "trade" && fields.firmName?.trim()) lines.push(`Trade Partner / Firm: ${fields.firmName.trim()}`);
	if (fields.clientType === "swatch" && fields.shippingAddress?.trim()) lines.push(`Material sample delivery address: ${fields.shippingAddress.trim()}`);
	if (fields.projectScope?.trim()) lines.push(`Project scope & estimate: ${fields.projectScope.trim()}`);
	if (selected.length) lines.push("My selection: " + selected.map((p) => `${p.name} (${p.palette})`).join(", ") + ".");
	if (fields.interest.startsWith("Kitchen")) lines.push(`Preferred layout: ${fields.layout}.`);
	if (fields.dimensions.trim()) lines.push("Room dimensions: " + fields.dimensions.trim());
	if (fields.notes.trim()) lines.push("", fields.notes.trim());
	if (fields.name.trim()) lines.push("", "Name: " + fields.name.trim());
	if (fields.contact.trim()) lines.push("Contact: " + fields.contact.trim());
	lines.push("", "Please share the next steps and available options.");
	return lines.join("\n");
}
//#endregion
//#region src/state/AppContext.tsx
var shortlistKey = "chandani-home-shortlist";
function useApplication(content) {
	const navigate = useNavigate();
	const location = useLocation();
	const products = useMemo(() => Object.fromEntries(content.products.map((p) => [p.id, p])), [content]);
	const [saved, setSaved] = useState(() => {
		const params = new URLSearchParams(location.search);
		return validShortlist(params.has("saved") ? params.get("saved").split(",") : readStored(shortlistKey) ?? readStored("chandani-shortlist-v2"), Object.keys(products));
	});
	const [panel, setPanel] = useState(null);
	const [tryEntry, setTryEntry] = useState(null);
	const [toastMessage, setToastMessage] = useState("");
	const [configuration, setConfiguration] = useState(() => restoreConfiguration(readStored(configurationKey)));
	const [savedConfiguration, setSavedConfiguration] = useState(() => {
		const value = readStored(savedConfigurationKey);
		return value && typeof value === "object" && "version" in value && value.version === 1 ? restoreConfiguration(value) : null;
	});
	const [enquiry, setEnquiry] = useState(() => newEnquiry("Whole home", []));
	const [enquiryHistory, setEnquiryHistory] = useState({});
	useEffect(() => {
		writeStored(shortlistKey, saved);
	}, [saved]);
	useEffect(() => {
		writeStored(configurationKey, configuration);
	}, [configuration]);
	useEffect(() => {
		if (!toastMessage) return;
		const timer = window.setTimeout(() => setToastMessage(""), 2600);
		return () => clearTimeout(timer);
	}, [toastMessage]);
	useEffect(() => {
		const sync = (event) => {
			if (event.key === shortlistKey) setSaved(validShortlist(readStored(shortlistKey), Object.keys(products)));
		};
		window.addEventListener("storage", sync);
		return () => window.removeEventListener("storage", sync);
	}, [products]);
	const productParam = new URLSearchParams(location.search).get("product");
	useEffect(() => {
		if (productParam && Object.hasOwn(products, productParam)) setPanel({
			kind: "product",
			id: productParam
		});
		else setPanel((previous) => previous?.kind === "product" ? null : previous);
	}, [productParam, products]);
	function query(values, hash, replace = false) {
		const params = new URLSearchParams(location.search);
		for (const [key, value] of Object.entries(values)) value === null ? params.delete(key) : params.set(key, value);
		navigate({
			pathname: location.pathname,
			search: params.toString(),
			hash: hash ?? location.hash
		}, {
			replace,
			state: { scrollHash: hash !== void 0 }
		});
	}
	function clearProductLink() {
		if (productParam) query({ product: null }, void 0, true);
	}
	function closePanel() {
		setPanel(null);
		clearProductLink();
	}
	function openPanel(kind) {
		clearProductLink();
		setPanel({ kind });
	}
	function openProduct(id) {
		if (!Object.hasOwn(products, id)) return;
		setPanel({
			kind: "product",
			id
		});
		query({ product: id });
	}
	function toggleSave(id) {
		if (!Object.hasOwn(products, id)) return;
		const isSaved = saved.includes(id);
		const product = products[id];
		setSaved((previous) => isSaved ? previous.filter((x) => x !== id) : [...previous, id]);
		setToastMessage(isSaved ? "Removed from your shortlist" : "Saved to your shortlist");
		if (isSaved) toast("Removed from shortlist", {
			description: product ? `${product.name} removed from your saved pieces.` : void 0,
			action: {
				label: "Undo",
				onClick: () => {
					setSaved((prev) => prev.includes(id) ? prev : [...prev, id]);
					setToastMessage("Saved to your shortlist");
				}
			}
		});
		else toast("Saved to your shortlist", {
			description: product ? `${product.name} saved in this browser.` : void 0,
			action: {
				label: "View shortlist",
				onClick: () => setPanel({ kind: "shortlist" })
			}
		});
	}
	function chooseVariant(room, slot, variant) {
		setConfiguration((previous) => selectVariant(previous, room, slot, variant));
	}
	function saveConfiguration() {
		const snapshot = structuredClone(configuration);
		if (writeStored("chandani-saved-room-configuration-v1", snapshot)) {
			setSavedConfiguration(snapshot);
			setToastMessage("Room selections saved in this browser");
			toast.success("Room selections saved", { description: "Stored in this browser for your next visit." });
		} else {
			setToastMessage("Browser storage is unavailable. Your selections remain for this visit.");
			toast.error("Browser storage unavailable", { description: "Your selections remain active for this visit." });
		}
	}
	function restoreSavedConfiguration() {
		if (!savedConfiguration) return;
		setConfiguration(structuredClone(savedConfiguration));
		setToastMessage("Saved room selections restored");
		toast("Saved room selections restored", { description: "Your saved room design has been reloaded." });
	}
	function openTry(productId, room) {
		const requestedRoom = new URLSearchParams(location.search).get("room");
		const targetRoom = room ?? (requestedRoom && Object.hasOwn(content.comparisons, requestedRoom) ? requestedRoom : "living");
		let entry = {
			room: targetRoom,
			item: content.comparisons[targetRoom].items[0].id
		};
		for (const [key, value] of Object.entries(content.comparisons)) {
			const match = productId && value.items.find((item) => item.product === productId || item.colours && [
				"clay",
				"chalk",
				"ink"
			].includes(productId));
			if (match) {
				entry = {
					room: key,
					item: match.id
				};
				if (match.colours) chooseVariant("living", "carpet", productId);
				break;
			}
		}
		setTryEntry(entry);
	}
	function openEnquiry(interest, clientType, extraNotes) {
		const selected = interest === "My shortlist" ? content.products.filter((p) => saved.includes(p.id)) : content.products.filter((p) => p.name === interest);
		const history = {
			...enquiryHistory,
			[enquiry.fields.interest]: enquiry
		};
		setEnquiryHistory(history);
		const previous = history[interest];
		const base = previous ? {
			...previous,
			selected: newEnquiry(interest, selected).selected
		} : newEnquiry(interest, selected);
		if (clientType) base.fields.clientType = clientType;
		if (extraNotes) base.fields.notes = extraNotes;
		setEnquiry(base);
		clearProductLink();
		setTryEntry(null);
		setPanel({ kind: "enquiry" });
	}
	function notify(msg) {
		setToastMessage(msg);
		toast(msg);
	}
	return {
		content,
		products,
		saved,
		toggleSave,
		panel,
		setPanel,
		closePanel,
		openPanel,
		openProduct,
		tryEntry,
		setTryEntry,
		openTry,
		openEnquiry,
		enquiry,
		setEnquiry,
		query,
		configuration,
		chooseVariant,
		saveConfiguration,
		restoreSavedConfiguration,
		savedConfiguration,
		toastMessage,
		notify
	};
}
var AppContext = createContext(null);
function AppProvider({ content, children }) {
	const app = useApplication(content);
	return /* @__PURE__ */ jsx(AppContext.Provider, {
		value: app,
		children
	});
}
function useApp() {
	const app = useContext(AppContext);
	if (!app) throw new Error("AppProvider is required");
	return app;
}
//#endregion
//#region src/components/Icon.tsx
function Icon({ name = "arrow" }) {
	return /* @__PURE__ */ jsxs("svg", {
		className: "icon",
		viewBox: "0 0 18 18",
		"aria-hidden": "true",
		children: [name === "search" && /* @__PURE__ */ jsx("circle", {
			cx: "8",
			cy: "8",
			r: "5"
		}), /* @__PURE__ */ jsx("path", { d: {
			arrow: "M4 14 14 4M4 4h10v10",
			save: "M5 3h8v12l-4-3-4 3z",
			search: "m12 12 4 4",
			close: "m4 4 10 10M14 4 4 14",
			menu: "M2 5h14M2 12h14",
			right: "M3 9h12M10 4l5 5-5 5"
		}[name] })]
	});
}
//#endregion
//#region src/components/Navigation.tsx
function SiteLink(props) {
	const { closePanel } = useApp();
	return /* @__PURE__ */ jsx(Link, {
		...props,
		state: { scrollHash: true },
		onClick: (event) => {
			props.onClick?.(event);
			if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) closePanel();
		}
	});
}
function Brand() {
	return /* @__PURE__ */ jsxs(SiteLink, {
		className: "brand",
		to: "/",
		"aria-label": "Chandani home",
		children: [/* @__PURE__ */ jsx("svg", {
			className: "mark",
			viewBox: "0 0 30 30",
			"aria-hidden": "true",
			children: /* @__PURE__ */ jsx("path", { d: "M25 5H5v20h20v-5M21 9H9v12h12v-5M17 13h-4v4h4M25 1v8M1 5h8M5 21v8M21 25h8" })
		}), /* @__PURE__ */ jsxs("span", { children: ["chandani", /* @__PURE__ */ jsx("small", { children: "HOME & INTERIORS" })] })]
	});
}
function Header() {
	const { saved, openPanel, openTry, tryEntry } = useApp();
	return /* @__PURE__ */ jsx("header", {
		className: "header",
		children: /* @__PURE__ */ jsxs("div", {
			className: "header-inner",
			children: [
				/* @__PURE__ */ jsx(Brand, {}),
				/* @__PURE__ */ jsxs("nav", {
					className: "desktop-nav",
					"aria-label": "Main navigation",
					children: [
						/* @__PURE__ */ jsx(SiteLink, {
							to: "/#categories",
							children: "Furniture & more"
						}),
						/* @__PURE__ */ jsx(SiteLink, {
							to: "/?category=carpets#collection",
							children: "Carpets"
						}),
						/* @__PURE__ */ jsx(SiteLink, {
							to: "/#kitchens",
							children: "Kitchen design"
						}),
						/* @__PURE__ */ jsx(SiteLink, {
							to: "/?room=living#home-room",
							children: "Explore rooms"
						}),
						/* @__PURE__ */ jsx("button", {
							className: "nav-try-room",
							onClick: () => openTry(),
							"aria-haspopup": "dialog",
							"aria-expanded": !!tryEntry,
							children: "Try the room"
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "header-actions",
					children: [
						/* @__PURE__ */ jsx("button", {
							className: "icon-button",
							"data-search": "",
							onClick: () => openPanel("search"),
							"aria-label": "Search the collection",
							children: /* @__PURE__ */ jsx(Icon, { name: "search" })
						}),
						/* @__PURE__ */ jsxs("button", {
							className: "shortlist-button",
							onClick: () => openPanel("shortlist"),
							"aria-label": "Open shortlist",
							children: [
								/* @__PURE__ */ jsx(Icon, { name: "save" }),
								/* @__PURE__ */ jsx("span", {
									className: "shortlist-word",
									children: "Shortlist"
								}),
								/* @__PURE__ */ jsx("span", {
									"data-count": "",
									children: saved.length
								})
							]
						}),
						/* @__PURE__ */ jsx("button", {
							className: "icon-button mobile-menu",
							onClick: () => openPanel("menu"),
							"aria-label": "Open menu",
							children: /* @__PURE__ */ jsx(Icon, { name: "menu" })
						})
					]
				})
			]
		})
	});
}
function MobileNavigation() {
	const { openPanel, openTry, openEnquiry, tryEntry } = useApp();
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("h2", {
			id: "drawerTitle",
			children: "Make yourself at home."
		}),
		/* @__PURE__ */ jsxs("nav", {
			className: "mobile-nav",
			"aria-label": "Mobile navigation",
			children: [
				/* @__PURE__ */ jsxs("button", {
					className: "mobile-try-room",
					onClick: () => openTry(),
					"aria-haspopup": "dialog",
					"aria-expanded": !!tryEntry,
					children: ["Try the room ", /* @__PURE__ */ jsx(Icon, {})]
				}),
				/* @__PURE__ */ jsx(SiteLink, {
					to: "/#categories",
					children: "Furniture & more"
				}),
				/* @__PURE__ */ jsx(SiteLink, {
					to: "/?category=carpets#collection",
					children: "Carpets"
				}),
				/* @__PURE__ */ jsx(SiteLink, {
					to: "/#kitchens",
					children: "Kitchen design"
				}),
				/* @__PURE__ */ jsx(SiteLink, {
					to: "/?room=living#home-room",
					children: "Explore the rooms"
				}),
				/* @__PURE__ */ jsx("button", {
					onClick: () => openPanel("search"),
					children: "Search the collection"
				}),
				/* @__PURE__ */ jsx(SiteLink, {
					to: "/carpet-studio",
					children: "Carpet studio"
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => openPanel("atelier"),
					children: "The Atelier Story"
				}),
				/* @__PURE__ */ jsx("button", {
					onClick: () => openEnquiry("Whole home"),
					children: "Start a conversation"
				})
			]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "drawer-concierge-card",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "KATHMANDU ATELIER"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "concierge-loc",
					children: "Baber Mahal Revisited · Courtyard II"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "concierge-phone",
					children: "+977 1 552 4890 · atelier@chandani.com.np"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "drawer-concierge-actions",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "quick-perk-chip",
						onClick: () => openEnquiry("Trade Partnership", "trade"),
						children: "Trade & Designers"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "quick-perk-chip",
						onClick: () => openEnquiry("Material Swatches", "swatch"),
						children: "Material Swatches"
					})]
				})
			]
		})
	] });
}
function Footer() {
	const { openEnquiry } = useApp();
	return /* @__PURE__ */ jsxs("footer", {
		className: "footer",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "footer-main",
			children: [
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Brand, {}), /* @__PURE__ */ jsxs("p", { children: [
					"Furniture, carpets and spaces",
					/* @__PURE__ */ jsx("br", {}),
					"to make your own."
				] })] }),
				/* @__PURE__ */ jsxs("nav", {
					"aria-label": "Collections",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "eyebrow",
							children: "EXPLORE"
						}),
						/* @__PURE__ */ jsx(SiteLink, {
							to: "/?category=seating#collection",
							children: "Sofas & seating"
						}),
						/* @__PURE__ */ jsx(SiteLink, {
							to: "/?category=carpets#collection",
							children: "Carpets"
						}),
						/* @__PURE__ */ jsx(SiteLink, {
							to: "/?category=bedroom#collection",
							children: "Bedroom"
						}),
						/* @__PURE__ */ jsx(SiteLink, {
							to: "/?category=dining#collection",
							children: "Dining"
						})
					]
				}),
				/* @__PURE__ */ jsxs("nav", {
					"aria-label": "Design services",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "eyebrow",
							children: "YOUR SPACE"
						}),
						/* @__PURE__ */ jsx(SiteLink, {
							to: "/#kitchens",
							children: "Kitchen design"
						}),
						/* @__PURE__ */ jsx(SiteLink, {
							to: "/?room=living#home-room",
							children: "Explore the rooms"
						}),
						/* @__PURE__ */ jsx(SiteLink, {
							to: "/carpet-studio",
							children: "Carpet comparison"
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: () => openEnquiry("Whole home"),
							children: "Start a conversation"
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "footer-note",
					children: [/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "A NOTE ON THIS EDITION"
					}), /* @__PURE__ */ jsx("p", { children: "Design preview. Product names, imagery and room schemes are illustrative; the final collection will feature Chandani’s actual range." })]
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "footer-bottom",
			children: [
				/* @__PURE__ */ jsx("span", { children: "© 2026 Chandani" }),
				/* @__PURE__ */ jsx("span", { children: "Furniture · Carpets · Interiors" }),
				/* @__PURE__ */ jsx("a", {
					href: "#main",
					children: "Back to top ↑"
				})
			]
		})]
	});
}
//#endregion
//#region src/hooks/useMotionPreference.ts
var query = "(prefers-reduced-motion: reduce)";
function subscribe(callback) {
	const preference = window.matchMedia(query);
	preference.addEventListener("change", callback);
	return () => preference.removeEventListener("change", callback);
}
var snapshot = () => window.matchMedia(query).matches;
function useMotionPreference() {
	return useSyncExternalStore(subscribe, snapshot, () => true);
}
//#endregion
//#region src/components/Interactions.tsx
function InteractionProvider({ children }) {
	const reduced = useMotionPreference();
	return /* @__PURE__ */ jsx(MotionConfig, {
		reducedMotion: reduced ? "always" : "never",
		transition: {
			duration: reduced ? 0 : .28,
			ease: [
				.16,
				1,
				.3,
				1
			]
		},
		children: /* @__PURE__ */ jsx(LazyMotion, {
			features: domAnimation,
			strict: true,
			children
		})
	});
}
function MotionButton({ ref, ...props }) {
	const reduced = useMotionPreference();
	return /* @__PURE__ */ jsx(m.button, {
		type: "button",
		...props,
		ref,
		whileHover: reduced || props.disabled ? void 0 : {
			y: -2,
			transition: { duration: .16 }
		},
		whileTap: reduced || props.disabled ? void 0 : {
			scale: .97,
			transition: { duration: .1 }
		},
		transition: { duration: reduced ? 0 : .2 }
	});
}
function RevealSection(props) {
	const ref = useRef(null);
	const inView = useInView(ref, {
		once: true,
		amount: .08
	});
	const controls = useAnimationControls();
	const reduced = useMotionPreference();
	const revealed = useRef(false);
	useEffect(() => {
		if (reduced) controls.set({
			opacity: 1,
			y: 0
		});
		else if (inView && !revealed.current) {
			revealed.current = true;
			if (!ref.current?.contains(document.activeElement)) controls.start({
				opacity: [.82, 1],
				y: [10, 0],
				transition: {
					duration: .48,
					ease: [
						.16,
						1,
						.3,
						1
					]
				}
			});
		}
		return () => controls.stop();
	}, [
		inView,
		reduced,
		controls
	]);
	return /* @__PURE__ */ jsx(m.section, {
		...props,
		ref,
		initial: false,
		animate: controls,
		onFocusCapture: () => {
			revealed.current = true;
			controls.stop();
			controls.set({
				opacity: 1,
				y: 0
			});
		}
	});
}
//#endregion
//#region src/data/sample.ts
var sampleProducts = [
	{
		id: "sofa",
		name: "Haven / Sofa",
		category: "seating",
		type: "Sofas & seating",
		image: "sofa.webp",
		palette: "Oatmeal",
		text: "Soft proportions and a quiet neutral palette. A comfortable starting point for a room built around everyday living.",
		scene: "living",
		featured: true,
		dimensions: {
			width: "240 cm (94.5\")",
			depth: "102 cm (40.2\")",
			height: "76 cm (30.0\")",
			seatHeight: "42 cm (16.5\")",
			clearance: "8 cm (3.1\")",
			weight: "78 kg"
		},
		materialsList: [
			"Solid kiln-dried FSC beech timber internal frame with reinforced mortise-and-tenon joinery",
			"High-resilience foam core core cushioned with certified recycled down-alternative micro-feathers",
			"Heavyweight 100% natural textured linen-cotton weave in Oatmeal with breathable protection",
			"Recessed solid smoked-oak low plinth base"
		],
		finishDetails: "Textured Oatmeal linen blend with matte smoked oak plinth.",
		careInstructions: [
			"Vacuum regularly using a low-suction setting and a clean, soft upholstery brush.",
			"Rotate and plump seat and back cushions weekly to maintain shape and even feather distribution.",
			"Blot spills immediately with a clean, dry undyed cloth; avoid vigorous rubbing.",
			"Professional in-situ upholstery cleaning recommended annually."
		],
		availability: "Made to order · 3 to 5 weeks in Kathmandu workshop",
		deliveryInfo: "Scheduled Kathmandu Valley delivery included: room-of-choice placement, leveling, and all packaging removed for recycling.",
		galleryImages: [
			{
				src: "sofa.webp",
				label: "Studio portrait",
				alt: "Haven Sofa studio portrait in Oatmeal linen"
			},
			{
				src: "hero-chalk-wide.webp",
				label: "Living room context",
				alt: "Haven Sofa styled in the Chandani living room"
			},
			{
				src: "without-sofa.webp",
				label: "Room before placement",
				alt: "Living room space before sofa placement"
			}
		],
		relatedIds: ["side-table", "chalk"]
	},
	{
		id: "chalk",
		name: "Frame / Chalk",
		category: "carpets",
		type: "Carpets",
		image: "product-chalk.webp",
		palette: "Oatmeal / soft taupe",
		text: "A light, textured field with a stepped double border. A quiet foundation that connects the pieces around it.",
		scene: "living",
		featured: true,
		dimensions: {
			width: "300 cm (118.1\")",
			depth: "240 cm (94.5\")",
			height: "1.4 cm pile height",
			weight: "30 kg"
		},
		materialsList: [
			"100% hand-spun New Zealand semi-worsted wool for natural stain resistance and resilience",
			"Organic unbleached cotton warp and double-weft backing",
			"Hand-tufted loop and cut pile combination creating micro-relief shadow lines"
		],
		finishDetails: "Textured chalk-oatmeal field with soft taupe stepped border.",
		careInstructions: [
			"Vacuum regularly with suction only; avoid rotary beater bars.",
			"Rotate 180 degrees once a year to balance natural sunlight and foot traffic.",
			"Blot damp spills with clean absorbent towel; do not scrub.",
			"Professional specialist wool rug wash recommended every 2 years."
		],
		availability: "In stock · Dispatches in 1–2 weeks (Custom sizes available in 8–10 weeks)",
		deliveryInfo: "Specialist rug courier with unrolling, custom natural rubber underlay placement, and packaging recycling.",
		galleryImages: [
			{
				src: "product-chalk.webp",
				label: "Weave flat lay",
				alt: "Frame Chalk carpet detail and border texture"
			},
			{
				src: "room-chalk.webp",
				label: "Room context",
				alt: "Frame Chalk carpet in styled living room"
			},
			{
				src: "room-empty.webp",
				label: "Bare oak floor",
				alt: "Bare oak floor without carpet"
			}
		],
		relatedIds: ["sofa", "side-table"]
	},
	{
		id: "dining-table",
		name: "Arc / Dining table",
		category: "dining",
		type: "Dining",
		image: "without-dining-chairs.webp",
		palette: "Natural oak tone",
		text: "Rounded edges and a generous tabletop. A design direction for everyday meals and the gatherings that run a little longer.",
		scene: "dining",
		featured: true,
		focus: "50%",
		dimensions: {
			width: "240 cm (94.5\")",
			depth: "100 cm (39.4\")",
			height: "75 cm (29.5\")",
			clearance: "71 cm (28.0\")",
			weight: "92 kg"
		},
		materialsList: [
			"Solid European white oak sustainably harvested from FSC-certified family-owned forests",
			"Integrated underside steel tension rods allowing natural timber expansion without cupping",
			"Hand-shaped bullnose radius corners and sculpted solid oak trestle leg joinery"
		],
		finishDetails: "Ultra-matte breathable organic hardwax-oil preserving raw oak texture.",
		careInstructions: [
			"Wipe down with a damp lint-free cloth; dry immediately with a clean microfiber towel.",
			"Use placemats or trivets for hot plates and chilled carafes to prevent thermal shock rings.",
			"Avoid chemical cleaners, alcohol, and acidic substances.",
			"Re-apply Chandani organic maintenance wax oil once every 12–18 months."
		],
		availability: "Made to order in Kathmandu Valley · 3–4 weeks",
		deliveryInfo: "Direct delivery and placement in Kathmandu Valley; positioning, leveling, and assembly included.",
		galleryImages: [
			{
				src: "without-dining-chairs.webp",
				label: "Dining table portrait",
				alt: "Arc Dining table crafted in solid white oak"
			},
			{
				src: "dining.webp",
				label: "Dining room in situ",
				alt: "Arc Dining table with chairs in dining room"
			},
			{
				src: "without-dining-table.webp",
				label: "Space without table",
				alt: "Dining room before dining table installation"
			}
		],
		relatedIds: ["dining-chair"]
	},
	{
		id: "bed",
		name: "Rest / Upholstered bed",
		category: "bedroom",
		type: "Bedroom",
		image: "bedroom.webp",
		palette: "Walnut / oatmeal",
		text: "A low timber frame and soft upholstered headboard. A warm, grounded starting point for your bedroom.",
		scene: "bedroom",
		featured: true,
		focus: "63%",
		dimensions: {
			width: "192 cm (75.6\" King)",
			depth: "224 cm (88.2\")",
			height: "108 cm headboard (42.5\")",
			clearance: "18 cm (7.1\")",
			weight: "110 kg"
		},
		materialsList: [
			"Solid American black walnut perimeter frame with hand-sanded eased edges",
			"Individually sprung curved European birch wood slats with central lumbar tension adjusters",
			"Belgian linen-blend upholstered headboard padded with hypoallergenic recycled wool fleece"
		],
		finishDetails: "Satin-rubbed natural walnut oil with textured Oatmeal wool-linen headboard.",
		careInstructions: [
			"Vacuum headboard quarterly using a gentle upholstery attachment.",
			"Dust walnut perimeter with a soft dry cotton cloth.",
			"Check and tighten hidden corner joinery fixings annually."
		],
		availability: "Made to order in Kathmandu Valley · 3–5 weeks",
		deliveryInfo: "Direct bedroom delivery and frame assembly in Kathmandu Valley.",
		galleryImages: [{
			src: "bedroom.webp",
			label: "Bedroom context",
			alt: "Rest Upholstered bed in bedroom"
		}, {
			src: "without-bed.webp",
			label: "Room before bed",
			alt: "Bedroom space before bed placement"
		}],
		relatedIds: ["lamp", "wardrobe"]
	},
	{
		id: "clay",
		name: "Frame / Clay",
		category: "carpets",
		type: "Carpets",
		image: "product-clay.webp",
		palette: "Terracotta / dark earth",
		text: "A warm terracotta field with a fine dark border. Clay adds colour and a stronger focal point to the room.",
		scene: "living",
		dimensions: {
			width: "300 cm (118.1\")",
			depth: "240 cm (94.5\")",
			height: "1.4 cm pile height",
			weight: "30 kg"
		},
		materialsList: [
			"100% hand-spun New Zealand wool dyed with mineral-rich non-toxic pigment washes",
			"Heavy organic cotton base weave with bound micro-stitched selvedges",
			"Cut and loop texture offering acoustic warmth and underfoot density"
		],
		finishDetails: "Terracotta earth center with fine ebonized dark earth border.",
		careInstructions: [
			"Suction-only vacuuming once to twice weekly.",
			"Treat stains promptly with clean water and mild pH-neutral wool detergent.",
			"Avoid high-moisture carpet shampoos."
		],
		availability: "Small batch production · Available in 2–3 weeks",
		deliveryInfo: "Direct delivery and unrolling with non-skid underlay in Kathmandu Valley.",
		galleryImages: [
			{
				src: "product-clay.webp",
				label: "Flat lay view",
				alt: "Frame Clay carpet texture and border"
			},
			{
				src: "room-clay.webp",
				label: "Room context",
				alt: "Frame Clay carpet in styled living room"
			},
			{
				src: "room-empty.webp",
				label: "Bare floor",
				alt: "Living room with bare floor"
			}
		],
		relatedIds: ["sofa", "side-table"]
	},
	{
		id: "ink",
		name: "Frame / Ink",
		category: "carpets",
		type: "Carpets",
		image: "product-ink.webp",
		palette: "Charcoal / warm ivory",
		text: "A deep charcoal field and warm ivory border. A graphic foundation for light upholstery and natural wood.",
		scene: "living",
		dimensions: {
			width: "300 cm (118.1\")",
			depth: "240 cm (94.5\")",
			height: "1.4 cm pile height",
			weight: "30 kg"
		},
		materialsList: [
			"100% premium long-staple New Zealand wool, naturally flame retardant and soil resistant",
			"Hand-woven double-warp cotton foundation for dimensional stability",
			"Deep charcoal saturated dye with natural unbleached ivory border yarns"
		],
		finishDetails: "Charcoal ink field with stepped ivory framing border.",
		careInstructions: [
			"Vacuum with suction nozzle; rotate position every six months for balanced foot traffic.",
			"Dab liquid spills with an undyed absorbent cloth immediately.",
			"Professional rug cleaning every 2 years."
		],
		availability: "In stock · Ready for showroom inspection",
		deliveryInfo: "Direct Kathmandu Valley room placement with protective felt underpad included.",
		galleryImages: [
			{
				src: "product-ink.webp",
				label: "Flat lay view",
				alt: "Frame Ink carpet weave and ivory border"
			},
			{
				src: "room-ink.webp",
				label: "Room context",
				alt: "Frame Ink carpet in styled living room"
			},
			{
				src: "room-empty.webp",
				label: "Bare floor",
				alt: "Living room before rug placement"
			}
		],
		relatedIds: ["sofa", "side-table"]
	},
	{
		id: "side-table",
		name: "Plinth / Side table",
		category: "seating",
		type: "Occasional furniture",
		image: "hero-chalk-wide.webp",
		palette: "Dark timber tone",
		text: "A small sculptural accent beside the sofa. A place for a book, a cup or a favourite object.",
		scene: "living",
		focus: "40%",
		dimensions: {
			width: "46 cm diameter (18.1\")",
			depth: "46 cm (18.1\")",
			height: "50 cm (19.7\")",
			weight: "18 kg"
		},
		materialsList: ["Turned solid oak monolith core weighted with an integrated lower steel stabilizing disc", "Subtle multifaceted cylindrical silhouette carved on computer-guided lathe and finished by hand"],
		finishDetails: "Ebonized dark timber stain with velvety protective low-gloss lacquer.",
		careInstructions: [
			"Dust with a dry or lightly dampened microfiber cloth.",
			"Use coasters for beverages to prevent moisture ring marks.",
			"Do not drag across timber or carpet floors; lift using both hands from the base."
		],
		availability: "In stock · Dispatches in 3–5 business days",
		deliveryInfo: "Protective carton courier delivery placed in your room of choice.",
		galleryImages: [{
			src: "hero-chalk-wide.webp",
			label: "Living room placement",
			alt: "Plinth Side table beside Haven Sofa"
		}, {
			src: "without-side-table.webp",
			label: "Room without table",
			alt: "Living room without side table"
		}],
		relatedIds: ["sofa", "chalk"]
	},
	{
		id: "dining-chair",
		name: "Line / Dining chair",
		category: "dining",
		type: "Dining",
		image: "dining.webp",
		palette: "Dark timber / woven seat",
		text: "A curved back and a woven-seat direction that brings texture to the table.",
		scene: "dining",
		focus: "52%",
		dimensions: {
			width: "54 cm (21.3\")",
			depth: "52 cm (20.5\")",
			height: "78 cm (30.7\")",
			seatHeight: "46 cm (18.1\")",
			weight: "6.8 kg"
		},
		materialsList: [
			"Steam-bent solid ash frame with mortise-and-tenon wood pinned joinery",
			"Hand-woven 3-ply Danish natural paper cord seat (120 meters continuous cord per chair)",
			"Subtle ergonomic curved lumbar support rail"
		],
		finishDetails: "Smoked ebonized timber stain with unbleached natural paper cord.",
		careInstructions: [
			"Gently vacuum cord seat with brush attachment to remove dust.",
			"Blot stains immediately with a damp white towel; do not saturate or scrub cord.",
			"Felt glides installed on feet protect hardwood floors."
		],
		availability: "Sets of 2, 4, 6, and 8 in stock · Dispatches in 1–2 weeks",
		deliveryInfo: "Delivered fully assembled in custom reusable cotton dust sleeves to your dining space.",
		galleryImages: [{
			src: "dining.webp",
			label: "Dining room in situ",
			alt: "Line dining chairs around dining table"
		}, {
			src: "without-dining-chairs.webp",
			label: "Table without chairs",
			alt: "Dining room without chairs"
		}],
		relatedIds: ["dining-table"]
	},
	{
		id: "lamp",
		name: "Halo / Table light",
		category: "lighting",
		type: "Lighting & décor",
		image: "bedroom.webp",
		palette: "Paper shade / warm timber",
		text: "A softly rounded light for the bedside or a quiet corner. Explore the balance between a useful light and a finishing detail.",
		scene: "bedroom",
		focus: "0%",
		dimensions: {
			width: "32 cm diameter (12.6\")",
			depth: "32 cm (12.6\")",
			height: "42 cm (16.5\")",
			clearance: "220 cm cord length",
			weight: "3.4 kg"
		},
		materialsList: [
			"Traditional Japanese washi paper shade with subtle organic fiber inclusions",
			"Solid turned American walnut plinth base",
			"Brushed solid brass rotary dimmer and cloth-covered natural cord"
		],
		finishDetails: "Translucent washi paper with oiled walnut base and brushed brass accents.",
		careInstructions: [
			"Dust paper shade with soft feather duster or dry compressed air canister.",
			"Wipe timber base with dry microfiber cloth.",
			"Use E26/E27 dimmable warm LED bulb (2700K recommended, max 12W LED)."
		],
		availability: "In stock · Dispatches in 2–4 business days",
		deliveryInfo: "Custom molded foam packaging via tracked express courier.",
		galleryImages: [{
			src: "bedroom.webp",
			label: "Bedside context",
			alt: "Halo table light on bedroom bedside"
		}, {
			src: "without-lamp.webp",
			label: "Room without light",
			alt: "Bedroom space before lamp placement"
		}],
		relatedIds: ["bed", "wardrobe"]
	},
	{
		id: "wardrobe",
		name: "Form / Wardrobe",
		category: "storage",
		type: "Storage",
		image: "bedroom.webp",
		palette: "Warm walnut tone",
		text: "Simple vertical lines and a warm timber palette. A starting point for thinking through storage in your space.",
		scene: "bedroom",
		focus: "100%",
		dimensions: {
			width: "120 cm single bay / 240 cm double suite (94.5\")",
			depth: "62 cm (24.4\")",
			height: "220 cm (86.6\")",
			weight: "145 kg"
		},
		materialsList: [
			"Solid American black walnut frame and reeded acoustic door fronts",
			"Aromatic solid cedar drawer interiors (naturally moth and moisture repellent)",
			"Blum soft-close concealed hinges and integrated motion-activated warm LED hanging rail"
		],
		finishDetails: "Warm walnut tone with tactile vertical fluting and recessed brass edge pulls.",
		careInstructions: [
			"Wipe exterior along the grain with a slightly damp cloth, then buff dry.",
			"Lightly sand interior cedar every 2 years with fine sandpaper to refresh natural scent.",
			"Clean recessed door channels with a vacuum crevice tool."
		],
		availability: "Custom modular build · Handcrafted in 8–10 weeks",
		deliveryInfo: "Specialist installation team delivers, anchors to wall, aligns doors, and vacuums interior.",
		galleryImages: [{
			src: "bedroom.webp",
			label: "Bedroom context",
			alt: "Form wardrobe in styled bedroom suite"
		}, {
			src: "without-wardrobe.webp",
			label: "Room without wardrobe",
			alt: "Bedroom space before wardrobe installation"
		}],
		relatedIds: ["bed", "lamp"]
	}
];
var sampleRooms = {
	living: {
		label: "The living room",
		number: "01",
		image: "hero-chalk-wide.webp",
		alt: "Living room with ivory sofa, a Chalk bordered carpet and a dark side table",
		items: [
			{
				product: "sofa",
				x: 73,
				y: 45,
				label: "The sofa"
			},
			{
				product: "chalk",
				x: 69,
				y: 79,
				label: "The carpet"
			},
			{
				product: "side-table",
				x: 44,
				y: 51,
				label: "The side table"
			}
		]
	},
	kitchen: {
		label: "The kitchen",
		number: "02",
		image: "kitchen.webp",
		alt: "Kitchen concept with a walnut island, stone-style worktop and green cabinets",
		items: [
			{
				id: "layout",
				x: 62,
				y: 65,
				label: "The layout",
				title: "Room to come together.",
				text: "An island-led arrangement with space to prepare, share and sit. Start with the measurements and everyday routines of your own kitchen.",
				interest: "Kitchen design: Layout"
			},
			{
				id: "storage",
				x: 90,
				y: 35,
				label: "The storage",
				title: "A place for everything.",
				text: "Explore how tall cupboards, drawers and integrated storage could work together in your kitchen.",
				interest: "Kitchen design: Storage"
			},
			{
				id: "finishes",
				x: 78,
				y: 51,
				label: "The finishes",
				title: "Warmth, in the details.",
				text: "A study in walnut tones, muted green and a pale worktop. Bring the colours and materials you are drawn to.",
				interest: "Kitchen design: Finishes"
			}
		]
	},
	bedroom: {
		label: "The bedroom",
		number: "03",
		image: "bedroom.webp",
		alt: "Bedroom concept with upholstered bed, bedside light and walnut wardrobe",
		items: [
			{
				product: "bed",
				x: 59,
				y: 65,
				label: "The bed"
			},
			{
				product: "lamp",
				x: 22,
				y: 47,
				label: "The light"
			},
			{
				product: "wardrobe",
				x: 89,
				y: 37,
				label: "The wardrobe"
			}
		]
	},
	dining: {
		label: "The dining room",
		number: "04",
		image: "dining.webp",
		alt: "Dining room concept with a rounded oak table and dark woven-seat chairs",
		items: [{
			product: "dining-table",
			x: 69,
			y: 46,
			label: "The table"
		}, {
			product: "dining-chair",
			x: 51,
			y: 74,
			label: "The chair"
		}]
	}
};
var sampleComparisons = {
	living: {
		label: "Living room",
		items: [
			{
				id: "sofa",
				split: 72,
				label: "Sofa",
				product: "sofa",
				before: "without-sofa.webp",
				after: "hero-chalk-wide.webp",
				ratio: 1919 / 820,
				withLabel: "With sofa",
				withoutLabel: "Without sofa"
			},
			{
				id: "carpet",
				label: "Carpet",
				product: "chalk",
				before: "room-empty.webp",
				after: "room-chalk.webp",
				ratio: 1.5,
				withLabel: "With carpet",
				withoutLabel: "Bare floor",
				colours: true
			},
			{
				id: "side-table",
				split: 46,
				label: "Side table",
				product: "side-table",
				before: "without-side-table.webp",
				after: "hero-chalk-wide.webp",
				ratio: 1919 / 820,
				withLabel: "With side table",
				withoutLabel: "Without side table"
			}
		]
	},
	dining: {
		label: "Dining room",
		items: [{
			id: "dining-table",
			label: "Dining table",
			product: "dining-table",
			before: "without-dining-table.webp",
			after: "dining.webp",
			ratio: 2.25,
			withLabel: "With table",
			withoutLabel: "Without table"
		}, {
			id: "dining-chair",
			label: "Dining chairs",
			product: "dining-chair",
			before: "without-dining-chairs.webp",
			after: "dining.webp",
			ratio: 2.25,
			withLabel: "With chairs",
			withoutLabel: "Without chairs"
		}]
	},
	bedroom: {
		label: "Bedroom",
		items: [
			{
				id: "bed",
				label: "Bed",
				product: "bed",
				before: "without-bed.webp",
				after: "bedroom.webp",
				ratio: 2.25,
				withLabel: "With bed",
				withoutLabel: "Without bed"
			},
			{
				id: "lamp",
				split: 22,
				label: "Table light",
				product: "lamp",
				before: "without-lamp.webp",
				after: "bedroom.webp",
				ratio: 2.25,
				withLabel: "With light",
				withoutLabel: "Without light"
			},
			{
				id: "wardrobe",
				split: 88,
				label: "Wardrobe",
				product: "wardrobe",
				before: "without-wardrobe.webp",
				after: "bedroom.webp",
				ratio: 2.25,
				withLabel: "With wardrobe",
				withoutLabel: "Without wardrobe"
			}
		]
	},
	kitchen: {
		label: "Kitchen",
		items: [{
			id: "kitchen",
			label: "Kitchen design",
			before: "without-kitchen.webp",
			after: "kitchen.webp",
			ratio: 2.25,
			withLabel: "Kitchen concept",
			withoutLabel: "Before the design",
			interest: "Kitchen design"
		}]
	}
};
//#endregion
//#region src/data/service.ts
var localCatalogueService = { async loadContent(signal) {
	signal?.throwIfAborted();
	if (typeof window !== "undefined" && typeof fetch === "function") try {
		const res = await fetch("http://127.0.0.1:8000/api/catalogue/", { signal });
		if (res.ok) {
			const remote = await res.json();
			if (remote?.products?.length && remote?.rooms && remote?.comparisons) return structuredClone({
				products: remote.products,
				rooms: remote.rooms,
				comparisons: remote.comparisons,
				settings: remote.settings
			});
		}
	} catch {}
	return structuredClone({
		products: sampleProducts,
		rooms: sampleRooms,
		comparisons: sampleComparisons
	});
} };
function formatNpr(amount) {
	if (amount === void 0 || amount === null) return "";
	return `रू ${amount.toLocaleString("en-IN")}`;
}
var formatNPR = formatNpr;
function searchCatalogue(products, query) {
	const term = query.trim().toLocaleLowerCase();
	return {
		products: products.filter((p) => `${p.name} ${p.category} ${p.type} ${p.palette}`.toLocaleLowerCase().includes(term)),
		kitchen: !term || "kitchen design layout storage cabinetry".includes(term)
	};
}
var asset = (name) => `/assets/${name}`;
//#endregion
//#region src/components/CrossfadeImage.tsx
function CrossfadeImage({ ready, revision = 0, ...props }) {
	const reduced = useMotionPreference();
	const [lastReady, setLastReady] = useState(props);
	const [outgoing, setOutgoing] = useState(null);
	if (ready && lastReady.src !== props.src) {
		setOutgoing(reduced ? null : lastReady);
		setLastReady(props);
	}
	useEffect(() => {
		if (reduced) setOutgoing(null);
	}, [reduced]);
	const displayed = ready ? props : lastReady;
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("img", { ...displayed }, revision), ready && !reduced && outgoing && /* @__PURE__ */ jsx(m.img, {
		...outgoing,
		id: void 0,
		alt: "",
		"aria-hidden": "true",
		initial: { opacity: 1 },
		animate: { opacity: 0 },
		transition: { duration: .24 },
		style: { pointerEvents: "none" },
		onAnimationComplete: () => setOutgoing((current) => current === outgoing ? null : current)
	}, `${outgoing.src}-${displayed.src}-${revision}`)] });
}
//#endregion
//#region src/hooks/useImagePair.ts
var cache = /* @__PURE__ */ new Map();
function preload(name) {
	let pending = cache.get(name);
	if (!pending) {
		pending = new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve();
			image.onerror = () => {
				cache.delete(name);
				reject(/* @__PURE__ */ new Error(`Image unavailable: ${name}`));
			};
			image.src = asset(name);
		});
		cache.set(name, pending);
	}
	return pending;
}
function useImagePair(before, after) {
	const key = `${before}|${after}`;
	const [attempt, setAttempt] = useState(0);
	const [result, setResult] = useState({
		key: "",
		attempt: -1,
		status: "loading"
	});
	useEffect(() => {
		let active = true;
		Promise.all([preload(before), preload(after)]).then(() => {
			if (active) setResult({
				key,
				attempt,
				status: "ready"
			});
		}, () => {
			if (active) setResult({
				key,
				attempt,
				status: "error"
			});
		});
		return () => {
			active = false;
		};
	}, [
		before,
		after,
		key,
		attempt
	]);
	return {
		status: result.key === key && result.attempt === attempt ? result.status : "loading",
		revision: attempt,
		retry: () => setAttempt((value) => value + 1)
	};
}
//#endregion
//#region src/components/CuratedCollections.tsx
var collections = [
	{
		id: "neutral-sanctuary",
		title: "The Warm Neutral Residence",
		subtitle: "Quiet textures, grounded timber, and luminous natural wool",
		image: "room-chalk.webp",
		palette: "Ivory Bouclé · American Walnut · Chalk Wool",
		paletteSwatches: [
			{
				name: "Ivory Bouclé",
				hex: "#ece5db"
			},
			{
				name: "American Walnut",
				hex: "#483528"
			},
			{
				name: "Chalk Tibetan Wool",
				hex: "#ded6cb"
			}
		],
		story: "Designed around natural Himalayan daylight and architectural calm. The Haven sofa in soft ivory bouclé provides cloud-like depth, anchored by an 80-knot chalk Tibetan wool carpet with delicate stepped borders. Solid walnut accents add necessary earth and shadow.",
		pieces: [
			{
				id: "sofa",
				name: "Haven / Sofa",
				category: "Seating",
				priceNPR: 32e4,
				x: 48,
				y: 44
			},
			{
				id: "chalk",
				name: "Frame / Chalk",
				category: "Carpets",
				priceNPR: 175e3,
				x: 50,
				y: 72
			},
			{
				id: "side-table",
				name: "Kanso / Coffee Table",
				category: "Living",
				priceNPR: 95e3,
				x: 80,
				y: 52
			},
			{
				id: "lamp",
				name: "Halo / Table Light",
				category: "Lighting",
				priceNPR: 38e3,
				x: 18,
				y: 38
			}
		]
	},
	{
		id: "heritage-earth",
		title: "The Mineral Heritage Sanctuary",
		subtitle: "Warm terracotta tones, native Sisau hardwood, and artisanal shadow",
		image: "room-clay.webp",
		palette: "Terracotta Earth · Solid Sisau · Patinated Brass",
		paletteSwatches: [
			{
				name: "Terracotta Mineral",
				hex: "#b3634b"
			},
			{
				name: "Terai Sisau Hardwood",
				hex: "#5c341f"
			},
			{
				name: "Patinated Brass",
				hex: "#b89552"
			}
		],
		story: "A celebration of natural mineral pigments and native Valley timber. The Frame Clay carpet provides an immediate thermal anchor to the room, dyed with organic madder root and mineral washes. Pairs with deep auburn Sisau joinery that matures in richness with touch and age.",
		pieces: [
			{
				id: "clay",
				name: "Frame / Clay",
				category: "Carpets",
				priceNPR: 18e4,
				x: 48,
				y: 68
			},
			{
				id: "sofa",
				name: "Haven / Sofa (Terracotta pairing)",
				category: "Seating",
				priceNPR: 32e4,
				x: 45,
				y: 40
			},
			{
				id: "side-table",
				name: "Solid Sisau Side Table",
				category: "Living",
				priceNPR: 48e3,
				x: 82,
				y: 52
			}
		]
	},
	{
		id: "evening-dining",
		title: "Evening Dining & Entertaining Suite",
		subtitle: "Quarter-sawn oak, sculpted seating, and generous clearance",
		image: "dining.webp",
		palette: "European White Oak · Oatmeal Linen · Charcoal Accent",
		paletteSwatches: [
			{
				name: "European White Oak",
				hex: "#988168"
			},
			{
				name: "Belgian Linen",
				hex: "#ded7cc"
			},
			{
				name: "Charcoal Patina",
				hex: "#2c2d30"
			}
		],
		story: "Engineered for long, comfortable dinner conversations. The Arc table features solid quarter-sawn white oak with eased bullnose contours, surrounded by ergonomic curved dining chairs that tuck cleanly under the apron. Proportioned to leave minimum 75cm pushback clearance.",
		pieces: [
			{
				id: "dining-table",
				name: "Arc / Dining Table",
				category: "Dining",
				priceNPR: 24e4,
				x: 52,
				y: 56
			},
			{
				id: "ink",
				name: "Frame / Ink Carpet",
				category: "Carpets",
				priceNPR: 185e3,
				x: 50,
				y: 80
			},
			{
				id: "wardrobe",
				name: "Form / Credenza Sideboard",
				category: "Storage",
				priceNPR: 285e3,
				x: 20,
				y: 38
			}
		]
	}
];
function CuratedCollections() {
	const { openProduct, openEnquiry, toggleSave, saved } = useApp();
	const [activeTab, setActiveTab] = useState(0);
	const [activePieceId, setActivePieceId] = useState(null);
	const current = collections[activeTab];
	const totalNPR = current.pieces.reduce((sum, p) => sum + p.priceNPR, 0);
	const handleSaveWholeCollection = () => {
		let addedCount = 0;
		current.pieces.forEach((p) => {
			if (!saved.includes(p.id)) {
				toggleSave(p.id);
				addedCount++;
			}
		});
		toast.success("Collection Saved to Shortlist", { description: `${current.pieces.length} coordinating pieces from ${current.title} added to your shortlist.` });
	};
	return /* @__PURE__ */ jsxs("section", {
		className: "curated-collections showroom-extension section",
		id: "curatedCollections",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "section-heading",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "CURATED RESIDENCES"
				}), /* @__PURE__ */ jsx("h2", { children: "Harmonious living, conceived as a whole." })] }), /* @__PURE__ */ jsx("p", { children: "We do not believe in isolated furniture cards. Each Chandani collection is a cohesive spatial study combining upholstery, hand-knotted weaving, and master joinery." })]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "collection-tabs-bar",
				role: "tablist",
				"aria-label": "Curated collections",
				children: collections.map((col, idx) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					role: "tab",
					"aria-selected": activeTab === idx,
					className: `collection-nav-tab${activeTab === idx ? " active" : ""}`,
					onClick: () => {
						setActiveTab(idx);
						setActivePieceId(null);
					},
					children: [/* @__PURE__ */ jsxs("span", {
						className: "tab-number",
						children: ["0", idx + 1]
					}), /* @__PURE__ */ jsx("span", {
						className: "tab-title",
						children: col.title
					})]
				}, col.id))
			}),
			/* @__PURE__ */ jsx(AnimatePresence, {
				mode: "wait",
				children: /* @__PURE__ */ jsxs(m.div, {
					className: "collection-editorial-card",
					initial: false,
					animate: {
						opacity: 1,
						y: 0
					},
					exit: {
						opacity: .88,
						y: -10
					},
					transition: {
						duration: .35,
						ease: [
							.16,
							1,
							.3,
							1
						]
					},
					children: [/* @__PURE__ */ jsxs("div", {
						className: "editorial-visual-frame",
						children: [
							/* @__PURE__ */ jsx("img", {
								src: asset(current.image),
								alt: current.title,
								loading: "lazy"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "collection-photo-hotspots",
								"aria-label": "Explore items in this scene",
								children: current.pieces.map((piece, pIdx) => {
									const isActive = activePieceId === piece.id;
									return /* @__PURE__ */ jsxs("div", {
										className: `editorial-hotspot-marker${isActive ? " active" : ""}`,
										style: {
											left: `${piece.x}%`,
											top: `${piece.y}%`
										},
										onMouseEnter: () => setActivePieceId(piece.id),
										onMouseLeave: () => setActivePieceId(null),
										children: [/* @__PURE__ */ jsxs("button", {
											type: "button",
											className: "hotspot-trigger-pin",
											onClick: () => openProduct(piece.id),
											"aria-label": `Explore ${piece.name} - ${formatNPR(piece.priceNPR)}`,
											children: [/* @__PURE__ */ jsx("span", { className: "pin-pulse" }), /* @__PURE__ */ jsxs("span", {
												className: "pin-num",
												children: ["0", pIdx + 1]
											})]
										}), /* @__PURE__ */ jsxs("div", {
											className: "hotspot-preview-card",
											role: "tooltip",
											children: [
												/* @__PURE__ */ jsx("span", {
													className: "preview-cat",
													children: piece.category
												}),
												/* @__PURE__ */ jsx("strong", { children: piece.name }),
												/* @__PURE__ */ jsx("span", {
													className: "preview-price",
													children: formatNPR(piece.priceNPR)
												})
											]
										})]
									}, piece.id);
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "visual-overlay-caption",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "palette-info-block",
									children: [/* @__PURE__ */ jsx("span", {
										className: "eyebrow",
										children: "PALETTE SPECIFICATION"
									}), /* @__PURE__ */ jsx("strong", { children: current.palette })]
								}), /* @__PURE__ */ jsx("div", {
									className: "palette-swatches-row",
									"aria-hidden": "true",
									children: current.paletteSwatches.map((swatch, sIdx) => /* @__PURE__ */ jsx("span", {
										className: "palette-swatch-dot",
										style: { backgroundColor: swatch.hex },
										title: swatch.name
									}, sIdx))
								})]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "editorial-story-content",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "story-header",
								children: [
									/* @__PURE__ */ jsxs("span", {
										className: "eyebrow",
										children: ["COLLECTION 0", activeTab + 1]
									}),
									/* @__PURE__ */ jsx("h3", { children: current.title }),
									/* @__PURE__ */ jsx("p", {
										className: "story-subtitle",
										children: current.subtitle
									})
								]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "story-body",
								children: current.story
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "story-shoppable-pieces",
								children: [/* @__PURE__ */ jsx("span", {
									className: "eyebrow",
									children: "INCLUDED IN THIS COMPOSITION"
								}), /* @__PURE__ */ jsx("div", {
									className: "pieces-list",
									children: current.pieces.map((piece, pIdx) => {
										const isActive = activePieceId === piece.id;
										return /* @__PURE__ */ jsxs("div", {
											className: `piece-row${isActive ? " highlighted" : ""}`,
											onMouseEnter: () => setActivePieceId(piece.id),
											onMouseLeave: () => setActivePieceId(null),
											children: [/* @__PURE__ */ jsxs("div", {
												className: "piece-meta",
												children: [/* @__PURE__ */ jsxs("span", {
													className: "piece-index",
													children: ["0", pIdx + 1]
												}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: piece.name }), /* @__PURE__ */ jsx("span", {
													className: "piece-cat",
													children: piece.category
												})] })]
											}), /* @__PURE__ */ jsxs("div", {
												className: "piece-actions",
												children: [/* @__PURE__ */ jsx("span", {
													className: "piece-price",
													children: formatNPR(piece.priceNPR)
												}), /* @__PURE__ */ jsx("button", {
													type: "button",
													className: "text-link-small",
													onClick: () => openProduct(piece.id),
													"aria-label": `Explore ${piece.name}`,
													children: "Details ↗"
												})]
											})]
										}, piece.id);
									})
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "editorial-actions-row",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "ensemble-pricing",
									children: [/* @__PURE__ */ jsx("span", { children: "Full Ensemble Total" }), /* @__PURE__ */ jsx("strong", { children: formatNPR(totalNPR) })]
								}), /* @__PURE__ */ jsxs("div", {
									className: "ensemble-buttons-cluster",
									children: [/* @__PURE__ */ jsxs("button", {
										type: "button",
										className: "button outline",
										onClick: handleSaveWholeCollection,
										"aria-label": "Save entire collection to shortlist",
										children: ["Save collection ", /* @__PURE__ */ jsx(Icon, { name: "save" })]
									}), /* @__PURE__ */ jsxs("button", {
										type: "button",
										className: "button",
										onClick: () => openEnquiry(`Curated Collection - ${current.title}`, "private", `Interested in commissioning the complete ${current.title} suite (Estimate: ${formatNPR(totalNPR)}).`),
										children: ["Enquire on this collection ", /* @__PURE__ */ jsx(Icon, {})]
									})]
								})]
							})
						]
					})]
				}, current.id)
			})
		]
	});
}
//#endregion
//#region src/components/ShopByRoom.tsx
var roomEditorials = [
	{
		id: "living",
		name: "Living Room Sanctuary",
		tagline: "Quiet comfort, acoustic calm, and enduring proportions",
		image: "hero-chalk-wide.webp",
		description: "The heart of the residential experience. Low-slung seating allows sightlines to flow uninterrupted, while a hand-knotted 80-knot wool carpet dampens ambient echo in open-plan spaces.",
		architecturalNote: "Recommended minimum ceiling clearance: 2.7 m. Allow 90 cm circulation clearance around the primary seating perimeter.",
		products: [
			{
				id: "sofa",
				name: "Haven / Sofa",
				role: "Primary Anchor",
				priceNPR: 32e4,
				image: "sofa.webp"
			},
			{
				id: "chalk",
				name: "Frame / Chalk Carpet",
				role: "Foundation",
				priceNPR: 175e3,
				image: "product-chalk.webp"
			},
			{
				id: "side-table",
				name: "Kanso / Coffee Table",
				role: "Joinery",
				priceNPR: 95e3,
				image: "without-lamp.webp"
			}
		]
	},
	{
		id: "dining",
		name: "Dining Sanctuary",
		tagline: "Quarter-sawn oak, comfortable seating, and generous clearance",
		image: "dining.webp",
		description: "Where conversations linger long after dinner concludes. Built with solid white oak seasoned specifically to withstand Himalayan seasonal humidity transitions.",
		architecturalNote: "Ensure minimum 75 cm chair pushback clearance from walls and 90 cm adjacent to sideboards or entryways.",
		products: [{
			id: "dining-table",
			name: "Arc / Dining Table",
			role: "Solid Oak Centerpiece",
			priceNPR: 24e4,
			image: "without-dining-chairs.webp"
		}, {
			id: "ink",
			name: "Frame / Ink Carpet",
			role: "Perimeter Foundation",
			priceNPR: 185e3,
			image: "product-ink.webp"
		}]
	},
	{
		id: "bedroom",
		name: "Bedroom Retreat",
		tagline: "Tactile linen, low timber frames, and mindful restful scale",
		image: "bedroom.webp",
		description: "A sanctuary designed for unhurried evenings and morning light. American walnut and breathable Belgian linen foster natural circadian calm.",
		architecturalNote: "Leave 65–75 cm on either side of the bed for nightstand access and effortless linen changes.",
		products: [
			{
				id: "bed",
				name: "Rest / Upholstered Bed",
				role: "King Bedstead",
				priceNPR: 295e3,
				image: "bedroom.webp"
			},
			{
				id: "wardrobe",
				name: "Form / Wardrobe",
				role: "Architectural Storage",
				priceNPR: 285e3,
				image: "without-lamp.webp"
			},
			{
				id: "lamp",
				name: "Halo / Table Light",
				role: "Ambient Glow",
				priceNPR: 38e3,
				image: "without-wardrobe.webp"
			}
		]
	},
	{
		id: "kitchen",
		name: "Kitchen & Gathering",
		tagline: "Custom walnut cabinetry, honed stone, and ergonomic flow",
		image: "kitchen.webp",
		description: "The modern hearth. Designed to combine high-performance culinary preparation with welcoming social breakfast seating.",
		architecturalNote: "Work triangle (hob to sink to refrigerator) perimeter kept within the ergonomic 4.0 m to 7.0 m standard.",
		products: [{
			id: "kitchen",
			name: "Chandani Kitchen Study",
			role: "Custom Cabinetry & Island",
			priceNPR: 85e4,
			image: "kitchen.webp"
		}]
	}
];
function ShopByRoom() {
	const { openProduct, openTry, openEnquiry, toggleSave, saved } = useApp();
	const [activeRoomId, setActiveRoomId] = useState("living");
	const current = roomEditorials.find((r) => r.id === activeRoomId) ?? roomEditorials[0];
	return /* @__PURE__ */ jsxs("section", {
		className: "shop-by-room showroom-extension section",
		id: "shopByRoom",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "section-heading",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "FOUR SPATIAL WORLDS"
				}), /* @__PURE__ */ jsx("h2", { children: "Shop by Room" })] }), /* @__PURE__ */ jsx("p", { children: "Select a room to explore complete furnished scenes, recommended proportions, and identifiable Chandani pieces." })]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "room-nav-pills",
				role: "tablist",
				"aria-label": "Select room editorial",
				children: roomEditorials.map((r, idx) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					role: "tab",
					"aria-selected": activeRoomId === r.id,
					className: `room-pill${activeRoomId === r.id ? " active" : ""}`,
					onClick: () => setActiveRoomId(r.id),
					children: [/* @__PURE__ */ jsxs("span", {
						className: "room-pill-num",
						children: ["0", idx + 1]
					}), /* @__PURE__ */ jsx("span", {
						className: "room-pill-label",
						children: r.name.split(" ")[0]
					})]
				}, r.id))
			}),
			/* @__PURE__ */ jsx(AnimatePresence, {
				mode: "wait",
				children: /* @__PURE__ */ jsxs(m.div, {
					className: "room-editorial-display",
					initial: false,
					animate: {
						opacity: 1,
						y: 0
					},
					exit: {
						opacity: .9,
						y: -10
					},
					transition: {
						duration: .35,
						ease: [
							.16,
							1,
							.3,
							1
						]
					},
					children: [/* @__PURE__ */ jsxs("div", {
						className: "room-display-photo",
						children: [
							/* @__PURE__ */ jsx("img", {
								src: asset(current.image),
								alt: current.name,
								loading: "lazy"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "photo-corner-badge",
								children: [/* @__PURE__ */ jsx("span", {
									className: "eyebrow",
									children: "ARCHITECTURAL GUIDANCE"
								}), /* @__PURE__ */ jsx("p", { children: current.architecturalNote })]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "photo-env-tag",
								children: /* @__PURE__ */ jsx("span", { children: current.name.toUpperCase() })
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "room-display-info",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "info-header",
								children: [
									/* @__PURE__ */ jsxs("span", {
										className: "eyebrow",
										children: [current.id.toUpperCase(), " ENVIRONMENT"]
									}),
									/* @__PURE__ */ jsx("h3", { children: current.name }),
									/* @__PURE__ */ jsx("p", {
										className: "tagline",
										children: current.tagline
									}),
									/* @__PURE__ */ jsx("p", {
										className: "description",
										children: current.description
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "room-featured-products",
								children: [/* @__PURE__ */ jsx("span", {
									className: "eyebrow",
									children: "IDENTIFIABLE PIECES IN THIS ROOM"
								}), /* @__PURE__ */ jsx("div", {
									className: "room-products-grid",
									children: current.products.map((prod) => {
										const isSaved = saved.includes(prod.id);
										return /* @__PURE__ */ jsxs("div", {
											className: "room-prod-card",
											children: [/* @__PURE__ */ jsx("div", {
												className: "prod-thumb",
												children: /* @__PURE__ */ jsx("img", {
													src: asset(prod.image),
													alt: prod.name,
													loading: "lazy"
												})
											}), /* @__PURE__ */ jsxs("div", {
												className: "prod-details",
												children: [
													/* @__PURE__ */ jsxs("div", {
														className: "prod-name-row",
														children: [/* @__PURE__ */ jsx("strong", { children: prod.name }), /* @__PURE__ */ jsx("button", {
															type: "button",
															className: `prod-quick-save${isSaved ? " saved" : ""}`,
															onClick: () => toggleSave(prod.id),
															"aria-label": `${isSaved ? "Remove" : "Save"} ${prod.name}`,
															children: /* @__PURE__ */ jsx(Icon, { name: "save" })
														})]
													}),
													/* @__PURE__ */ jsx("span", {
														className: "prod-role",
														children: prod.role
													}),
													/* @__PURE__ */ jsx("span", {
														className: "prod-price",
														children: formatNPR(prod.priceNPR)
													}),
													/* @__PURE__ */ jsxs("div", {
														className: "prod-card-links",
														children: [/* @__PURE__ */ jsx("button", {
															type: "button",
															className: "text-link-small",
															onClick: () => openProduct(prod.id),
															children: "Specifications ↗"
														}), /* @__PURE__ */ jsx("button", {
															type: "button",
															className: "text-link-small try-link",
															onClick: () => openTry(prod.id, current.id),
															children: "Try in Room ↗"
														})]
													})
												]
											})]
										}, prod.id);
									})
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "room-cta-row",
								children: [/* @__PURE__ */ jsxs("button", {
									type: "button",
									className: "button",
									onClick: () => openTry(current.products[0]?.id, current.id),
									children: ["Experience in Try the Room ", /* @__PURE__ */ jsx(Icon, {})]
								}), /* @__PURE__ */ jsx("button", {
									type: "button",
									className: "button outline",
									onClick: () => openEnquiry(`${current.name} Design Consultation`, "private"),
									children: "Consult on this room"
								})]
							})
						]
					})]
				}, current.id)
			})
		]
	});
}
//#endregion
//#region src/components/MaterialsExplorer.tsx
var woods = [
	{
		id: "sisau",
		name: "Solid Sisau (Indian Rosewood)",
		category: "wood",
		origin: "Terai Foothills & Kathmandu Valley",
		spec: "Dense interlocking auburn grain",
		finish: "Hand-rubbed natural linseed oil",
		durability: "Exceptional native hardwood; highly resistant to humidity fluctuation",
		hex: "#5c341f",
		tactileNote: "Cool to touch, develops rich dark patina over decades"
	},
	{
		id: "walnut",
		name: "American Black Walnut",
		category: "wood",
		origin: "Sustainably Managed Appalachian Forests",
		spec: "Subdued espresso tone with smooth linear grain",
		finish: "Matte breathable organic hardwax oil",
		durability: "Stable, velvety tactile finish with long-term dimensional integrity",
		hex: "#433428",
		tactileNote: "Silky matte feel, low light glare"
	},
	{
		id: "oak",
		name: "European White Oak",
		category: "wood",
		origin: "Sustainably Certified Alpine Woodlands",
		spec: "Biscuit-warm field with distinct ray flecks",
		finish: "Ultra-matte raw wax preservation",
		durability: "High surface hardness; withstands active dining and family living",
		hex: "#967f64",
		tactileNote: "Open-pore architectural grain texture"
	},
	{
		id: "ash",
		name: "Natural Olive Ash",
		category: "wood",
		origin: "Northern Certified Groves",
		spec: "Silvery pale timber with wave figuring",
		finish: "Soap-rubbed breathable matte sealer",
		durability: "High elasticity and tensile strength; maximizes ambient room light",
		hex: "#b3997b",
		tactileNote: "Luminous, Scandinavian lightness"
	}
];
var fabrics = [
	{
		id: "linen-ivory",
		name: "Belgian Slubbed Linen (Ivory)",
		category: "fabric",
		origin: "Flanders, Belgium (100% natural flax)",
		spec: "480 g/m² heavyweight organic weave",
		finish: "Enzyme-washed natural texture",
		durability: "35,000 Martindale rubs; breathes in summer, softens with age",
		hex: "#e6dfd3",
		tactileNote: "Textured slub weave with natural breathability"
	},
	{
		id: "boucle-oatmeal",
		name: "Himalayan Wool Bouclé (Oatmeal)",
		category: "fabric",
		origin: "High-Altitude Wool & Cotton Core",
		spec: "620 g/m² dense loop pile",
		finish: "Unbleached textured tactile loop",
		durability: "45,000 Martindale rubs; acoustic warmth and natural soil resistance",
		hex: "#d2c5b4",
		tactileNote: "Cloud-like loop depth with acoustic absorption"
	},
	{
		id: "velvet-moss",
		name: "Cotton Velvet (Deep Moss)",
		category: "fabric",
		origin: "Loomed in northern Italy",
		spec: "540 g/m² combed cotton pile",
		finish: "Directional low-sheen matte velvet",
		durability: "50,000 Martindale rubs; deep colour depth in evening light",
		hex: "#3f4738",
		tactileNote: "Deep plush pile with rich shadow gradations"
	},
	{
		id: "wool-slate",
		name: "Heather Wool (Warm Slate)",
		category: "fabric",
		origin: "Pure Virgin Wool Twill",
		spec: "510 g/m² tight twill weave",
		finish: "Naturally water-repellent lanolin finish",
		durability: "40,000 Martindale rubs; naturally fire-resistant without chemicals",
		hex: "#5c5f63",
		tactileNote: "Subtle tailored twill with natural resilience"
	}
];
var carpets = [
	{
		id: "tibetan-chalk",
		name: "Highland Wool (Chalk Taupe)",
		category: "carpet",
		origin: "Patan Weaving Studio, Nepal",
		spec: "80-knot hand-spun Tibetan sheep wool",
		finish: "14 mm plush cut pile with stepped micro-border",
		durability: "Lanolin-rich wool; naturally resilient against furniture crushing",
		hex: "#ded6cb",
		tactileNote: "Plush underfoot with sound-dampening acoustic density"
	},
	{
		id: "mineral-clay",
		name: "Terracotta Mineral (Clay Earth)",
		category: "carpet",
		origin: "Kathmandu Valley Dye House",
		spec: "Hand-knotted cut & loop combination",
		finish: "12 mm stepped relief with dark earth frame",
		durability: "Organic madder root wash; holds rich tonal depth for generations",
		hex: "#b36b51",
		tactileNote: "Textured cut-and-loop relief with grounding warmth"
	},
	{
		id: "charcoal-ink",
		name: "Midnight Weave (Deep Ink)",
		category: "carpet",
		origin: "Tibetan Plateau Semi-Worsted Wool",
		spec: "Double-weft dense structural backing",
		finish: "14 mm cut pile with subtle shadow lines",
		durability: "High foot-traffic resilience; grounds furniture in light floors",
		hex: "#2d2e33",
		tactileNote: "Heavy grounding weight that absorbs ambient light"
	}
];
var stones = [
	{
		id: "marble-banswara",
		name: "Banswara White Marble",
		category: "stone",
		origin: "Rajasthan Quarzitic Formations",
		spec: "Soft grey feather veining on pure calcium field",
		finish: "Satin-honed matte touch (non-gloss)",
		durability: "Natural cool stone; sealed against culinary oils and moisture",
		hex: "#ebe8e1",
		tactileNote: "Cool silk-honed surface with delicate mineral clouding"
	},
	{
		id: "slate-honed",
		name: "Himalayan Honed Slate",
		category: "stone",
		origin: "Mustang Mountain Formations",
		spec: "Dark charcoal fine-cleft mineral face",
		finish: "Natural beeswax oil sealant",
		durability: "Extreme heat resistance; ideal for hearths and dining trivets",
		hex: "#3a3d40",
		tactileNote: "Organic fine-cleft mineral texture"
	},
	{
		id: "brass-patinated",
		name: "Patinated Valley Brass",
		category: "stone",
		origin: "Patan Bronze Artisans, Kathmandu",
		spec: "Solid architectural brass alloy",
		finish: "Hand-aged brush finish with micro-crystalline wax",
		durability: "Develops a bespoke living patina with touch and age",
		hex: "#b89552",
		tactileNote: "Warm metallic weight that records family touch over time"
	}
];
function MaterialsExplorer() {
	const { openEnquiry } = useApp();
	const [selectedWood, setSelectedWood] = useState(woods[0]);
	const [selectedFabric, setSelectedFabric] = useState(fabrics[0]);
	const [selectedCarpet, setSelectedCarpet] = useState(carpets[0]);
	const [selectedStone, setSelectedStone] = useState(stones[0]);
	const [lighting, setLighting] = useState("day");
	const handleEnquirePalette = () => {
		const summary = `Selected Materials: ${selectedWood.name}, ${selectedFabric.name}, ${selectedCarpet.name}, and ${selectedStone.name}.`;
		openEnquiry("Material Consultation", "swatch", summary);
	};
	const handleOrderSwatchBox = () => {
		const summary = `Requesting complimentary physical material swatch box:\n- Wood: ${selectedWood.name}\n- Upholstery: ${selectedFabric.name}\n- Carpet: ${selectedCarpet.name}\n- Surface/Metal: ${selectedStone.name}`;
		openEnquiry("Complimentary Material Swatch Kit", "swatch", summary);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "materials-explorer",
		id: "materialsExplorer",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "explorer-header",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "AUTHENTIC FINISHES & TEXTURES"
				}),
				/* @__PURE__ */ jsx("h3", { children: "The Materials Explorer" }),
				/* @__PURE__ */ jsx("p", { children: "Compare real timbers, hand-spun upholstery weaves, high-altitude carpets, and natural stone finishes. Test how different materials interact under natural daylight and warm evening lamps." })
			] }), /* @__PURE__ */ jsxs("div", {
				className: "lighting-toggle",
				role: "group",
				"aria-label": "Preview ambient lighting",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "lighting-label",
						children: "Ambient Light:"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: `lighting-btn${lighting === "day" ? " active" : ""}`,
						"aria-pressed": lighting === "day",
						onClick: () => setLighting("day"),
						children: "Daylight (5500K)"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: `lighting-btn${lighting === "evening" ? " active" : ""}`,
						"aria-pressed": lighting === "evening",
						onClick: () => setLighting("evening"),
						children: "Evening (2700K)"
					})
				]
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: `explorer-grid lighting-${lighting}`,
			children: [/* @__PURE__ */ jsxs("div", {
				className: "materials-selectors",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "material-group",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "group-header-row",
								children: [/* @__PURE__ */ jsx("span", {
									className: "group-label",
									children: "01 / Solid Hardwood Joinery"
								}), selectedWood.tactileNote && /* @__PURE__ */ jsx("span", {
									className: "tactile-pill",
									children: selectedWood.tactileNote
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "swatch-chips",
								role: "group",
								"aria-label": "Select wood finish",
								children: woods.map((wood) => /* @__PURE__ */ jsxs("button", {
									type: "button",
									className: `swatch-chip${selectedWood.id === wood.id ? " active" : ""}`,
									"aria-pressed": selectedWood.id === wood.id,
									onClick: () => setSelectedWood(wood),
									children: [/* @__PURE__ */ jsx("span", {
										className: "swatch-color",
										style: { backgroundColor: wood.hex }
									}), /* @__PURE__ */ jsx("span", {
										className: "swatch-name",
										children: wood.name.split("(")[0].trim()
									})]
								}, wood.id))
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "chip-description",
								children: [
									/* @__PURE__ */ jsxs("strong", { children: [selectedWood.name, ":"] }),
									" ",
									selectedWood.spec,
									" from ",
									selectedWood.origin,
									". ",
									selectedWood.finish,
									"."
								]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "material-group",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "group-header-row",
								children: [/* @__PURE__ */ jsx("span", {
									className: "group-label",
									children: "02 / Upholstery Weave"
								}), selectedFabric.tactileNote && /* @__PURE__ */ jsx("span", {
									className: "tactile-pill",
									children: selectedFabric.tactileNote
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "swatch-chips",
								role: "group",
								"aria-label": "Select upholstery fabric",
								children: fabrics.map((fabric) => /* @__PURE__ */ jsxs("button", {
									type: "button",
									className: `swatch-chip${selectedFabric.id === fabric.id ? " active" : ""}`,
									"aria-pressed": selectedFabric.id === fabric.id,
									onClick: () => setSelectedFabric(fabric),
									children: [/* @__PURE__ */ jsx("span", {
										className: "swatch-color",
										style: { backgroundColor: fabric.hex }
									}), /* @__PURE__ */ jsx("span", {
										className: "swatch-name",
										children: fabric.name.split("(")[0].trim()
									})]
								}, fabric.id))
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "chip-description",
								children: [
									/* @__PURE__ */ jsxs("strong", { children: [selectedFabric.name, ":"] }),
									" ",
									selectedFabric.spec,
									". ",
									selectedFabric.durability,
									"."
								]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "material-group",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "group-header-row",
								children: [/* @__PURE__ */ jsx("span", {
									className: "group-label",
									children: "03 / Hand-Knotted Carpet Foundation"
								}), selectedCarpet.tactileNote && /* @__PURE__ */ jsx("span", {
									className: "tactile-pill",
									children: selectedCarpet.tactileNote
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "swatch-chips",
								role: "group",
								"aria-label": "Select carpet foundation",
								children: carpets.map((carpet) => /* @__PURE__ */ jsxs("button", {
									type: "button",
									className: `swatch-chip${selectedCarpet.id === carpet.id ? " active" : ""}`,
									"aria-pressed": selectedCarpet.id === carpet.id,
									onClick: () => setSelectedCarpet(carpet),
									children: [/* @__PURE__ */ jsx("span", {
										className: "swatch-color",
										style: { backgroundColor: carpet.hex }
									}), /* @__PURE__ */ jsx("span", {
										className: "swatch-name",
										children: carpet.name.split("(")[0].trim()
									})]
								}, carpet.id))
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "chip-description",
								children: [
									/* @__PURE__ */ jsxs("strong", { children: [selectedCarpet.name, ":"] }),
									" ",
									selectedCarpet.spec,
									". ",
									selectedCarpet.finish,
									"."
								]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "material-group",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "group-header-row",
								children: [/* @__PURE__ */ jsx("span", {
									className: "group-label",
									children: "04 / Stone & Architectural Hardware"
								}), selectedStone.tactileNote && /* @__PURE__ */ jsx("span", {
									className: "tactile-pill",
									children: selectedStone.tactileNote
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "swatch-chips",
								role: "group",
								"aria-label": "Select stone or hardware",
								children: stones.map((stone) => /* @__PURE__ */ jsxs("button", {
									type: "button",
									className: `swatch-chip${selectedStone.id === stone.id ? " active" : ""}`,
									"aria-pressed": selectedStone.id === stone.id,
									onClick: () => setSelectedStone(stone),
									children: [/* @__PURE__ */ jsx("span", {
										className: "swatch-color",
										style: { backgroundColor: stone.hex }
									}), /* @__PURE__ */ jsx("span", {
										className: "swatch-name",
										children: stone.name
									})]
								}, stone.id))
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "chip-description",
								children: [
									/* @__PURE__ */ jsxs("strong", { children: [selectedStone.name, ":"] }),
									" ",
									selectedStone.spec,
									". ",
									selectedStone.finish,
									"."
								]
							})
						]
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "materials-tray-card",
				"aria-label": "Combined Material Palette Presentation",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "tray-topline",
						children: [/* @__PURE__ */ jsx("span", {
							className: "eyebrow",
							children: "PALETTE COMBINATION"
						}), /* @__PURE__ */ jsx("span", {
							className: "tray-lighting-tag",
							children: lighting === "day" ? "Natural Morning Sun" : "Warm Evening Lamp"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "tray-composition-visual",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "tray-tile tile-wood",
								style: { backgroundColor: selectedWood.hex },
								children: /* @__PURE__ */ jsxs("div", {
									className: "tile-glass-badge",
									children: [/* @__PURE__ */ jsx("span", {
										className: "tile-category",
										children: "WOOD"
									}), /* @__PURE__ */ jsx("strong", { children: selectedWood.name.split("(")[0].trim() })]
								})
							}),
							/* @__PURE__ */ jsx("div", {
								className: "tray-tile tile-fabric",
								style: { backgroundColor: selectedFabric.hex },
								children: /* @__PURE__ */ jsxs("div", {
									className: "tile-glass-badge",
									children: [/* @__PURE__ */ jsx("span", {
										className: "tile-category",
										children: "UPHOLSTERY"
									}), /* @__PURE__ */ jsx("strong", { children: selectedFabric.name.split("(")[0].trim() })]
								})
							}),
							/* @__PURE__ */ jsx("div", {
								className: "tray-tile tile-carpet",
								style: { backgroundColor: selectedCarpet.hex },
								children: /* @__PURE__ */ jsxs("div", {
									className: "tile-glass-badge",
									children: [/* @__PURE__ */ jsx("span", {
										className: "tile-category",
										children: "CARPET"
									}), /* @__PURE__ */ jsx("strong", { children: selectedCarpet.name.split("(")[0].trim() })]
								})
							}),
							/* @__PURE__ */ jsx("div", {
								className: "tray-tile tile-stone",
								style: { backgroundColor: selectedStone.hex },
								children: /* @__PURE__ */ jsxs("div", {
									className: "tile-glass-badge",
									children: [/* @__PURE__ */ jsx("span", {
										className: "tile-category",
										children: "SURFACE"
									}), /* @__PURE__ */ jsx("strong", { children: selectedStone.name })]
								})
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "tray-spec-summary",
						children: [
							/* @__PURE__ */ jsx("h4", { children: "Bespoke Material Synergy" }),
							/* @__PURE__ */ jsxs("p", { children: [
								"Combining ",
								/* @__PURE__ */ jsx("strong", { children: selectedWood.name.split("(")[0].trim() }),
								" with",
								" ",
								/* @__PURE__ */ jsx("strong", { children: selectedFabric.name.split("(")[0].trim() }),
								" creates a tactile balance between architectural timber weight and soft light reflection. Grounded by ",
								/* @__PURE__ */ jsx("strong", { children: selectedCarpet.name.split("(")[0].trim() }),
								", this palette provides acoustic calm and enduring elegance."
							] }),
							/* @__PURE__ */ jsxs("div", {
								className: "tray-actions",
								children: [/* @__PURE__ */ jsxs("button", {
									type: "button",
									className: "button",
									onClick: handleEnquirePalette,
									children: ["Enquire with this palette ", /* @__PURE__ */ jsx(Icon, {})]
								}), /* @__PURE__ */ jsx("button", {
									type: "button",
									className: "button outline",
									onClick: handleOrderSwatchBox,
									children: "Order physical swatch box ↗"
								})]
							})
						]
					})
				]
			})]
		})]
	});
}
//#endregion
//#region src/components/PlanningAssistant.tsx
function PlanningAssistant() {
	const { openEnquiry } = useApp();
	const [roomType, setRoomType] = useState("living");
	const [length, setLength] = useState(4.8);
	const [width, setWidth] = useState(4.2);
	const lengthFt = (length * 3.28084).toFixed(1);
	const widthFt = (width * 3.28084).toFixed(1);
	const areaSqM = (length * width).toFixed(1);
	const areaSqFt = (length * width * 10.7639).toFixed(0);
	const getAdvice = () => {
		if (roomType === "living") return {
			rugSize: length >= 5 || width >= 4.5 ? "9 ft × 12 ft (2.7 m × 3.6 m)" : "8 ft × 10 ft (2.4 m × 3.0 m)",
			furnitureScale: `Recommended sofa length: ${length >= 5 ? "2.4 m to 2.7 m 3-seater with chaise" : "2.1 m to 2.3 m 3-seater"}`,
			walkwayClearance: "Main traffic pathways: minimum 90 cm. Coffee table distance: 38–45 cm from sofa edge.",
			goldenRule: "Front legs of all main seating pieces should rest 20–30 cm onto the rug to anchor the group together."
		};
		if (roomType === "dining") return {
			rugSize: "Must extend at least 60 cm beyond table perimeter on all four sides",
			furnitureScale: `Recommended capacity: ${length >= 5 && width >= 3.8 ? "8 to 10 guests (2.4 m to 2.8 m table)" : "6 guests (1.8 m to 2.2 m table)"}`,
			walkwayClearance: "Minimum 75 cm chair pull-out clearance (90 cm if adjacent to a credenza or doorway).",
			goldenRule: "Ensure dining chair legs never catch on the carpet edge when guests slide back from the table."
		};
		if (roomType === "bedroom") return {
			rugSize: "8 ft × 10 ft placed under lower two-thirds of the bed, extending 70 cm on sides and foot",
			furnitureScale: `Recommended bed scale: ${width >= 4 ? "King bed (192 cm width) with dual 60 cm nightstands" : "Queen bed (160 cm width)"}`,
			walkwayClearance: "Minimum 65–75 cm bedside walkways to allow natural closet and drawer opening.",
			goldenRule: "Leave the head of the bed and nightstands on bare timber for easier cord and lamp management."
		};
		return {
			rugSize: "Runner format: 75 cm × 250 cm placed along the main preparation or sink counter",
			furnitureScale: "Island dimensions: recommended 90 cm to 110 cm depth with seating overhang of 30 cm",
			walkwayClearance: "Minimum 100 cm between island and counters for single cook; 120 cm for dual-cook traffic.",
			goldenRule: "The work triangle (sink to stove to refrigerator) should total between 4.0 m and 7.5 m in perimeter."
		};
	};
	const advice = getAdvice();
	const handleApplySpecs = () => {
		const details = `${roomType.toUpperCase()} Room Dimensions: ${length} m × ${width} m (${lengthFt} ft × ${widthFt} ft / ${areaSqFt} sq.ft). Recommended rug: ${advice.rugSize}. Scale: ${advice.furnitureScale}.`;
		openEnquiry(`Interior Planning Consultation - ${roomType.charAt(0).toUpperCase() + roomType.slice(1)}`, "private", details);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "planning-assistant",
		id: "planningAssistant",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "assistant-header",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "ARCHITECTURAL PROPORTIONS & SCALE"
				}),
				/* @__PURE__ */ jsx("h3", { children: "The Interior Planning Assistant" }),
				/* @__PURE__ */ jsx("p", { children: "Avoid costly sizing mistakes before you purchase. Test your exact room dimensions to calculate recommended carpet sizes, sofa lengths, dining clearances, and circulation walkways." })
			] }), /* @__PURE__ */ jsx("div", {
				className: "room-type-tabs",
				role: "tablist",
				"aria-label": "Select room type for planning advice",
				children: [
					"living",
					"dining",
					"bedroom",
					"kitchen"
				].map((type) => /* @__PURE__ */ jsx("button", {
					type: "button",
					role: "tab",
					"aria-selected": roomType === type,
					className: `room-type-tab${roomType === type ? " active" : ""}`,
					onClick: () => setRoomType(type),
					children: type.charAt(0).toUpperCase() + type.slice(1)
				}, type))
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "assistant-body",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "assistant-controls-card",
				children: [
					/* @__PURE__ */ jsx("h4", { children: "Room Dimensions" }),
					/* @__PURE__ */ jsxs("div", {
						className: "dimension-slider-group",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "slider-label-row",
							children: [/* @__PURE__ */ jsx("label", {
								htmlFor: "lengthSlider",
								children: "Room Length"
							}), /* @__PURE__ */ jsxs("span", {
								className: "slider-val",
								children: [
									length.toFixed(1),
									" m (",
									lengthFt,
									" ft)"
								]
							})]
						}), /* @__PURE__ */ jsx("input", {
							id: "lengthSlider",
							type: "range",
							min: "3.0",
							max: "9.0",
							step: "0.2",
							value: length,
							onChange: (e) => setLength(parseFloat(e.target.value)),
							"aria-label": "Room length in meters"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "dimension-slider-group",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "slider-label-row",
							children: [/* @__PURE__ */ jsx("label", {
								htmlFor: "widthSlider",
								children: "Room Width"
							}), /* @__PURE__ */ jsxs("span", {
								className: "slider-val",
								children: [
									width.toFixed(1),
									" m (",
									widthFt,
									" ft)"
								]
							})]
						}), /* @__PURE__ */ jsx("input", {
							id: "widthSlider",
							type: "range",
							min: "2.5",
							max: "7.0",
							step: "0.2",
							value: width,
							onChange: (e) => setWidth(parseFloat(e.target.value)),
							"aria-label": "Room width in meters"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "room-area-summary",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Estimated Floor Area" }), /* @__PURE__ */ jsxs("strong", { children: [
							areaSqM,
							" m² ",
							/* @__PURE__ */ jsxs("small", { children: [
								"(",
								areaSqFt,
								" sq. ft)"
							] })
						] })] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Room Category" }), /* @__PURE__ */ jsx("strong", {
							style: { textTransform: "capitalize" },
							children: roomType
						})] })]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "floorplan-mini-diagram",
						"aria-hidden": "true",
						children: /* @__PURE__ */ jsxs("svg", {
							viewBox: "0 0 320 200",
							className: "floorplan-svg",
							children: [
								/* @__PURE__ */ jsx("rect", {
									x: "20",
									y: "20",
									width: "280",
									height: "160",
									rx: "4",
									fill: "var(--warm-stone, #ede8e1)",
									stroke: "var(--ink, #1f2022)",
									strokeWidth: "1.5",
									strokeDasharray: "4 2"
								}),
								roomType === "living" && /* @__PURE__ */ jsxs(Fragment, { children: [
									/* @__PURE__ */ jsx("rect", {
										x: "70",
										y: "50",
										width: "180",
										height: "100",
										rx: "2",
										fill: "#c79279",
										opacity: "0.45"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "160",
										y: "105",
										textAnchor: "middle",
										fontSize: "10",
										fill: "var(--ink, #1f2022)",
										fontWeight: "600",
										children: "RECOMMENDED RUG"
									}),
									/* @__PURE__ */ jsx("rect", {
										x: "90",
										y: "40",
										width: "140",
										height: "35",
										rx: "3",
										fill: "#ffffff",
										stroke: "var(--ink, #1f2022)",
										strokeWidth: "1.2"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "160",
										y: "62",
										textAnchor: "middle",
										fontSize: "9",
										fill: "var(--ink, #1f2022)",
										children: "Haven Sofa (2.2m)"
									}),
									/* @__PURE__ */ jsx("rect", {
										x: "125",
										y: "90",
										width: "70",
										height: "30",
										rx: "3",
										fill: "#5c341f",
										opacity: "0.85"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "160",
										y: "108",
										textAnchor: "middle",
										fontSize: "8",
										fill: "#ffffff",
										children: "Coffee Table"
									}),
									/* @__PURE__ */ jsx("line", {
										x1: "20",
										y1: "95",
										x2: "65",
										y2: "95",
										stroke: "#8a8782",
										strokeWidth: "1",
										strokeDasharray: "2 2"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "42",
										y: "90",
										textAnchor: "middle",
										fontSize: "8",
										fill: "#8a8782",
										children: "90cm path"
									})
								] }),
								roomType === "dining" && /* @__PURE__ */ jsxs(Fragment, { children: [
									/* @__PURE__ */ jsx("rect", {
										x: "60",
										y: "45",
										width: "200",
										height: "110",
										rx: "2",
										fill: "#c79279",
										opacity: "0.45"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "160",
										y: "60",
										textAnchor: "middle",
										fontSize: "9",
										fill: "var(--ink, #1f2022)",
										fontWeight: "600",
										children: "RUG EXTENSION (+60cm)"
									}),
									/* @__PURE__ */ jsx("rect", {
										x: "100",
										y: "70",
										width: "120",
										height: "60",
										rx: "4",
										fill: "#5c341f",
										opacity: "0.9"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "160",
										y: "105",
										textAnchor: "middle",
										fontSize: "10",
										fill: "#ffffff",
										fontWeight: "600",
										children: "Arc Dining Table"
									}),
									/* @__PURE__ */ jsx("circle", {
										cx: "120",
										cy: "55",
										r: "8",
										fill: "#ffffff",
										stroke: "var(--ink)",
										strokeWidth: "1"
									}),
									/* @__PURE__ */ jsx("circle", {
										cx: "160",
										cy: "55",
										r: "8",
										fill: "#ffffff",
										stroke: "var(--ink)",
										strokeWidth: "1"
									}),
									/* @__PURE__ */ jsx("circle", {
										cx: "200",
										cy: "55",
										r: "8",
										fill: "#ffffff",
										stroke: "var(--ink)",
										strokeWidth: "1"
									}),
									/* @__PURE__ */ jsx("circle", {
										cx: "120",
										cy: "145",
										r: "8",
										fill: "#ffffff",
										stroke: "var(--ink)",
										strokeWidth: "1"
									}),
									/* @__PURE__ */ jsx("circle", {
										cx: "160",
										cy: "145",
										r: "8",
										fill: "#ffffff",
										stroke: "var(--ink)",
										strokeWidth: "1"
									}),
									/* @__PURE__ */ jsx("circle", {
										cx: "200",
										cy: "145",
										r: "8",
										fill: "#ffffff",
										stroke: "var(--ink)",
										strokeWidth: "1"
									})
								] }),
								roomType === "bedroom" && /* @__PURE__ */ jsxs(Fragment, { children: [
									/* @__PURE__ */ jsx("rect", {
										x: "80",
										y: "70",
										width: "160",
										height: "100",
										rx: "2",
										fill: "#c79279",
										opacity: "0.45"
									}),
									/* @__PURE__ */ jsx("rect", {
										x: "105",
										y: "30",
										width: "110",
										height: "110",
										rx: "3",
										fill: "#ffffff",
										stroke: "var(--ink, #1f2022)",
										strokeWidth: "1.2"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "160",
										y: "90",
										textAnchor: "middle",
										fontSize: "10",
										fill: "var(--ink, #1f2022)",
										children: "Rest Bed (King)"
									}),
									/* @__PURE__ */ jsx("rect", {
										x: "75",
										y: "30",
										width: "22",
										height: "22",
										rx: "2",
										fill: "#5c341f"
									}),
									/* @__PURE__ */ jsx("rect", {
										x: "223",
										y: "30",
										width: "22",
										height: "22",
										rx: "2",
										fill: "#5c341f"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "86",
										y: "44",
										textAnchor: "middle",
										fontSize: "7",
										fill: "#ffffff",
										children: "Stand"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "234",
										y: "44",
										textAnchor: "middle",
										fontSize: "7",
										fill: "#ffffff",
										children: "Stand"
									})
								] }),
								roomType === "kitchen" && /* @__PURE__ */ jsxs(Fragment, { children: [
									/* @__PURE__ */ jsx("rect", {
										x: "20",
										y: "20",
										width: "280",
										height: "35",
										fill: "#ded8ce",
										stroke: "var(--ink)",
										strokeWidth: "1"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "160",
										y: "42",
										textAnchor: "middle",
										fontSize: "9",
										fill: "var(--ink)",
										children: "Wall Cabinets & Prep Counter (60cm depth)"
									}),
									/* @__PURE__ */ jsx("rect", {
										x: "70",
										y: "95",
										width: "180",
										height: "45",
										rx: "3",
										fill: "#5c341f",
										opacity: "0.9"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "160",
										y: "122",
										textAnchor: "middle",
										fontSize: "10",
										fill: "#ffffff",
										fontWeight: "600",
										children: "Central Island (Walnut & Stone)"
									}),
									/* @__PURE__ */ jsx("line", {
										x1: "160",
										y1: "56",
										x2: "160",
										y2: "94",
										stroke: "#c79279",
										strokeWidth: "1.5",
										strokeDasharray: "3 2"
									}),
									/* @__PURE__ */ jsx("text", {
										x: "165",
										y: "78",
										fontSize: "8",
										fill: "var(--ink)",
										fontWeight: "600",
										children: "100–120cm Walkway"
									})
								] })
							]
						})
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "assistant-findings-card",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "TAILORED ERGONOMIC SPECIFICATIONS"
					}),
					/* @__PURE__ */ jsxs("h4", { children: [
						"Recommendations for your ",
						roomType,
						" space"
					] }),
					/* @__PURE__ */ jsxs("div", {
						className: "advice-spec-list",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "advice-item",
								children: [/* @__PURE__ */ jsx("span", {
									className: "advice-badge",
									children: "CARPET SCALE"
								}), /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: advice.rugSize }) })]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "advice-item",
								children: [/* @__PURE__ */ jsx("span", {
									className: "advice-badge",
									children: "FURNITURE PROPORTION"
								}), /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: advice.furnitureScale }) })]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "advice-item",
								children: [/* @__PURE__ */ jsx("span", {
									className: "advice-badge",
									children: "CIRCULATION CLEARANCE"
								}), /* @__PURE__ */ jsx("p", { children: advice.walkwayClearance })]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "advice-item advice-golden-rule",
								children: [/* @__PURE__ */ jsx("span", {
									className: "advice-badge",
									children: "ARCHITECTURAL RULE"
								}), /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsxs("em", { children: [
									"“",
									advice.goldenRule,
									"”"
								] }) })]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "findings-action",
						children: [/* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "button",
							onClick: handleApplySpecs,
							children: ["Apply dimensions to consultation enquiry ", /* @__PURE__ */ jsx(Icon, {})]
						}), /* @__PURE__ */ jsx("p", {
							className: "fineprint",
							children: "Dimensions will pre-populate your consultation draft. Our design team will verify structural tolerances and site constraints."
						})]
					})
				]
			})]
		})]
	});
}
//#endregion
//#region src/components/RoomStudio.tsx
var studioInventory = {
	sofa: [{
		id: "sofa",
		name: "Haven / Sofa",
		type: "Living",
		palette: "Ivory / bouclé",
		priceNPR: 32e4,
		image: "sofa.webp"
	}, {
		id: "chair",
		name: "Monolith / Lounge Chair",
		type: "Living",
		palette: "Oatmeal / solid ash",
		priceNPR: 145e3,
		image: "without-side-table.webp"
	}],
	carpet: [
		{
			id: "clay",
			name: "Frame / Clay",
			type: "Carpets",
			palette: "Terracotta / dark earth",
			priceNPR: 18e4,
			image: "product-clay.webp"
		},
		{
			id: "chalk",
			name: "Frame / Chalk",
			type: "Carpets",
			palette: "Oatmeal / soft taupe",
			priceNPR: 175e3,
			image: "product-chalk.webp"
		},
		{
			id: "ink",
			name: "Frame / Ink",
			type: "Carpets",
			palette: "Midnight charcoal / deep navy",
			priceNPR: 185e3,
			image: "product-ink.webp"
		}
	],
	table: [{
		id: "side-table",
		name: "Kanso / Coffee Table",
		type: "Living",
		palette: "American Walnut",
		priceNPR: 95e3,
		image: "without-lamp.webp"
	}, {
		id: "dining-table",
		name: "Arc / Dining Table",
		type: "Dining",
		palette: "Solid White Oak",
		priceNPR: 24e4,
		image: "without-dining-chairs.webp"
	}],
	accent: [{
		id: "lamp",
		name: "Halo / Table Light",
		type: "Lighting",
		palette: "Patinated Brass & Alabaster",
		priceNPR: 38e3,
		image: "without-wardrobe.webp"
	}, {
		id: "wardrobe",
		name: "Form / Wardrobe",
		type: "Storage",
		palette: "Natural Walnut & Cane",
		priceNPR: 285e3,
		image: "bedroom.webp"
	}]
};
function RoomStudio() {
	const { toggleSave, saved, openEnquiry, openTry } = useApp();
	const [selectedSofa, setSelectedSofa] = useState(studioInventory.sofa[0]);
	const [selectedCarpet, setSelectedCarpet] = useState(studioInventory.carpet[0]);
	const [selectedTable, setSelectedTable] = useState(studioInventory.table[0]);
	const [selectedAccent, setSelectedAccent] = useState(studioInventory.accent[0]);
	const totalPackageNPR = selectedSofa.priceNPR + selectedCarpet.priceNPR + selectedTable.priceNPR + selectedAccent.priceNPR;
	const handleSaveWholeSet = () => {
		const ids = [
			selectedSofa.id,
			selectedCarpet.id,
			selectedTable.id,
			selectedAccent.id
		];
		let addedCount = 0;
		ids.forEach((id) => {
			if (!saved.includes(id)) {
				toggleSave(id);
				addedCount++;
			}
		});
		toast.success("Room Set Saved to Shortlist", { description: `${addedCount} coordinating pieces added to your personal shortlist.` });
	};
	const handleEnquireSet = () => {
		const list = `${selectedSofa.name} (${formatNPR(selectedSofa.priceNPR)}), ${selectedCarpet.name} (${formatNPR(selectedCarpet.priceNPR)}), ${selectedTable.name} (${formatNPR(selectedTable.priceNPR)}), and ${selectedAccent.name} (${formatNPR(selectedAccent.priceNPR)}). Package Estimate: ${formatNPR(totalPackageNPR)}.`;
		openEnquiry("Coordinated Room Studio Package", "private", `Interested in commissioning this bespoke room ensemble:\n${list}`);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "room-studio-showcase",
		id: "roomStudio",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "studio-top-intro",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "BESPOKE INTERIOR ENSEMBLE"
					}),
					/* @__PURE__ */ jsx("h3", { children: "The Chandani Room Studio" }),
					/* @__PURE__ */ jsx("p", { children: "Curate coordinating furniture, high-altitude carpets, and sculptural lighting into an intentional room package. Independently tailor each element to your home's architecture while viewing transparent estimates in Nepali Rupees." })
				] }), /* @__PURE__ */ jsxs("div", {
					className: "studio-package-badge",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "badge-label",
							children: "COORDINATED ENSEMBLE TOTAL"
						}),
						/* @__PURE__ */ jsx("strong", {
							className: "badge-price",
							children: formatNPR(totalPackageNPR)
						}),
						/* @__PURE__ */ jsx("small", { children: "Including Kathmandu Valley delivery & positioning" })
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "room-studio-grid",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "studio-slot-card",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "slot-visual",
							children: [/* @__PURE__ */ jsx(AnimatePresence, {
								mode: "wait",
								children: /* @__PURE__ */ jsx(m.img, {
									src: asset(selectedSofa.image),
									alt: selectedSofa.name,
									loading: "lazy",
									initial: false,
									animate: {
										opacity: 1,
										scale: 1
									},
									exit: {
										opacity: .85,
										scale: .98
									},
									transition: { duration: .25 }
								}, selectedSofa.id)
							}), /* @__PURE__ */ jsx("span", {
								className: "slot-badge",
								children: "01 / SEATING ANCHOR"
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "slot-details",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "slot-title-row",
									children: [/* @__PURE__ */ jsx("h4", { children: selectedSofa.name }), /* @__PURE__ */ jsx("span", {
										className: "slot-price",
										children: formatNPR(selectedSofa.priceNPR)
									})]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "slot-palette",
									children: selectedSofa.palette
								}),
								/* @__PURE__ */ jsx("div", {
									className: "slot-variants-row",
									role: "group",
									"aria-label": "Choose seating anchor",
									children: studioInventory.sofa.map((s) => /* @__PURE__ */ jsx("button", {
										type: "button",
										className: `variant-pill${selectedSofa.id === s.id ? " active" : ""}`,
										"aria-pressed": selectedSofa.id === s.id,
										onClick: () => setSelectedSofa(s),
										children: s.name.split("/")[1]?.trim() ?? s.name
									}, s.id))
								})
							]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "studio-slot-card",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "slot-visual",
							children: [/* @__PURE__ */ jsx(AnimatePresence, {
								mode: "wait",
								children: /* @__PURE__ */ jsx(m.img, {
									src: asset(selectedCarpet.image),
									alt: selectedCarpet.name,
									loading: "lazy",
									initial: false,
									animate: {
										opacity: 1,
										scale: 1
									},
									exit: {
										opacity: .85,
										scale: .98
									},
									transition: { duration: .25 }
								}, selectedCarpet.id)
							}), /* @__PURE__ */ jsx("span", {
								className: "slot-badge",
								children: "02 / CARPET FOUNDATION"
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "slot-details",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "slot-title-row",
									children: [/* @__PURE__ */ jsx("h4", { children: selectedCarpet.name }), /* @__PURE__ */ jsx("span", {
										className: "slot-price",
										children: formatNPR(selectedCarpet.priceNPR)
									})]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "slot-palette",
									children: selectedCarpet.palette
								}),
								/* @__PURE__ */ jsx("div", {
									className: "slot-variants-row",
									role: "group",
									"aria-label": "Choose carpet colourway",
									children: studioInventory.carpet.map((c) => /* @__PURE__ */ jsx("button", {
										type: "button",
										className: `variant-pill${selectedCarpet.id === c.id ? " active" : ""}`,
										"aria-pressed": selectedCarpet.id === c.id,
										onClick: () => setSelectedCarpet(c),
										children: c.name.split("/")[1]?.trim() ?? c.name
									}, c.id))
								})
							]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "studio-slot-card",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "slot-visual",
							children: [/* @__PURE__ */ jsx(AnimatePresence, {
								mode: "wait",
								children: /* @__PURE__ */ jsx(m.img, {
									src: asset(selectedTable.image),
									alt: selectedTable.name,
									loading: "lazy",
									initial: false,
									animate: {
										opacity: 1,
										scale: 1
									},
									exit: {
										opacity: .85,
										scale: .98
									},
									transition: { duration: .25 }
								}, selectedTable.id)
							}), /* @__PURE__ */ jsx("span", {
								className: "slot-badge",
								children: "03 / HARDWOOD JOINERY"
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "slot-details",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "slot-title-row",
									children: [/* @__PURE__ */ jsx("h4", { children: selectedTable.name }), /* @__PURE__ */ jsx("span", {
										className: "slot-price",
										children: formatNPR(selectedTable.priceNPR)
									})]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "slot-palette",
									children: selectedTable.palette
								}),
								/* @__PURE__ */ jsx("div", {
									className: "slot-variants-row",
									role: "group",
									"aria-label": "Choose joinery piece",
									children: studioInventory.table.map((t) => /* @__PURE__ */ jsx("button", {
										type: "button",
										className: `variant-pill${selectedTable.id === t.id ? " active" : ""}`,
										"aria-pressed": selectedTable.id === t.id,
										onClick: () => setSelectedTable(t),
										children: t.name.split("/")[1]?.trim() ?? t.name
									}, t.id))
								})
							]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "studio-slot-card",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "slot-visual",
							children: [/* @__PURE__ */ jsx(AnimatePresence, {
								mode: "wait",
								children: /* @__PURE__ */ jsx(m.img, {
									src: asset(selectedAccent.image),
									alt: selectedAccent.name,
									loading: "lazy",
									initial: false,
									animate: {
										opacity: 1,
										scale: 1
									},
									exit: {
										opacity: .85,
										scale: .98
									},
									transition: { duration: .25 }
								}, selectedAccent.id)
							}), /* @__PURE__ */ jsx("span", {
								className: "slot-badge",
								children: "04 / ACCENT & LIGHTING"
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "slot-details",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "slot-title-row",
									children: [/* @__PURE__ */ jsx("h4", { children: selectedAccent.name }), /* @__PURE__ */ jsx("span", {
										className: "slot-price",
										children: formatNPR(selectedAccent.priceNPR)
									})]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "slot-palette",
									children: selectedAccent.palette
								}),
								/* @__PURE__ */ jsx("div", {
									className: "slot-variants-row",
									role: "group",
									"aria-label": "Choose accent piece",
									children: studioInventory.accent.map((a) => /* @__PURE__ */ jsx("button", {
										type: "button",
										className: `variant-pill${selectedAccent.id === a.id ? " active" : ""}`,
										"aria-pressed": selectedAccent.id === a.id,
										onClick: () => setSelectedAccent(a),
										children: a.name.split("/")[1]?.trim() ?? a.name
									}, a.id))
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "studio-actions-footer",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "footer-harmony-note",
					children: [/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "CURATORIAL SYNERGY"
					}), /* @__PURE__ */ jsxs("p", { children: [
						/* @__PURE__ */ jsx("strong", { children: selectedSofa.palette.split("/")[0].trim() }),
						" upholstery is grounded by the",
						" ",
						/* @__PURE__ */ jsx("strong", { children: selectedCarpet.palette.split("/")[0].trim() }),
						" weave, with natural wood warmth from the",
						" ",
						/* @__PURE__ */ jsx("strong", { children: selectedTable.palette }),
						" joinery."
					] })]
				}), /* @__PURE__ */ jsxs("div", {
					className: "footer-cta-buttons",
					children: [
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "button outline",
							onClick: handleSaveWholeSet,
							children: ["Save all 4 pieces to shortlist ", /* @__PURE__ */ jsx(Icon, { name: "save" })]
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "button outline",
							onClick: () => openTry("sofa", "living"),
							children: ["Test in Try the Room ", /* @__PURE__ */ jsx(Icon, {})]
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "button",
							onClick: handleEnquireSet,
							children: [
								"Enquire on ensemble (",
								formatNPR(totalPackageNPR),
								") ",
								/* @__PURE__ */ jsx(Icon, {})
							]
						})
					]
				})]
			})
		]
	});
}
//#endregion
//#region src/components/DesignJournal.tsx
var articles = [
	{
		id: "rug-sizing",
		category: "PROPORTIONS & SCALE",
		title: "The Rug Sizing Rulebook: Why Bigger Is Almost Always Better",
		summary: "A rug that is too small floats like an island and shrinks the visual boundaries of your room. Here is the architectural guide to getting the dimensions right the first time.",
		readTime: "4 min read",
		keyRule: "Rule: The front legs of your sofa and armchairs should always rest 20 to 30 cm onto the rug to anchor the seating group.",
		content: [
			"In residential interior design, the most common spatial mistake is selecting a 5×7 ft rug for a standard living room. An undersized rug breaks the cohesion of the furniture and makes the space appear disjointed.",
			"For standard Kathmandu living spaces (approximately 14×16 ft or larger), an 8×10 ft (2.4×3.0 m) rug is the minimum recommended scale. It allows the front legs of the sofa, coffee table, and accent chairs to rest comfortably on the pile.",
			"In dining rooms, the rule is even stricter: the carpet must extend at least 60 cm beyond the table edges on all four sides. This guarantees that when guests slide their chairs back to stand, the rear legs stay safely on the pile without catching the edge."
		]
	},
	{
		id: "clearances",
		category: "ERGONOMICS",
		title: "Living Room Clearances: Walkways, Reach, and Breathing Room",
		summary: "Comfort is not just the softness of your sofa cushion; it is the subconscious ease of moving through your space without turning sideways or bumping your knees.",
		readTime: "3 min read",
		keyRule: "Rule: Maintain 38–45 cm between the sofa and coffee table, and minimum 90 cm for primary circulation paths.",
		content: [
			"When placing a coffee table, 40 cm is the ergonomic sweet spot: close enough to set down a cup of tea or a book without leaning forward, yet spacious enough to slide your legs through comfortably.",
			"Primary circulation pathways connecting doorways to seating areas should maintain a minimum width of 90 cm (3 feet). Secondary pathways, such as passing between an accent chair and a bookshelf, can narrow to 70 cm.",
			"Keep lighting cord runs concealed along baseboards or under flat-woven rug pads to eliminate visual and physical clutter."
		]
	},
	{
		id: "timber-care",
		category: "MATERIAL CARE",
		title: "Solid Hardwood in the Kathmandu Valley: Monsoon to Winter",
		summary: "Solid Sisau, Oak, and Walnut are living, breathing natural materials. Here is how to keep your joinery stable through shifting seasonal humidity.",
		readTime: "5 min read",
		keyRule: "Rule: Use breathable organic wax-oil finishes that allow wood pores to expand and contract naturally without surface cracking.",
		content: [
			"Kathmandu experiences dramatic shifts in relative humidity, from over 85% during the monsoon down to under 25% during dry winter months. Thick synthetic polyurethane coats trap internal moisture, causing warping or clouding.",
			"Chandani applies breathable plant-based hardwax oils that penetrate deep into the timber grain, forming a flexible microscopic barrier that shields against water rings while allowing the wood to breathe.",
			"Never place solid timber furniture directly against a high-output radiant space heater or radiator. Maintain a minimum distance of 1 meter to avoid localized desiccation."
		]
	},
	{
		id: "upholstery-weaves",
		category: "TEXTILE SELECTION",
		title: "Linen, Bouclé, or Velvet: Selecting Upholstery for Real Homes",
		summary: "Balancing tactile luxury with durability. An honest breakdown of rub counts, natural soil resistance, and daily maintenance.",
		readTime: "4 min read",
		keyRule: "Rule: For active family rooms, select natural fibers blended with tight double-wefts rated at 35,000+ Martindale rubs.",
		content: [
			"Belgian linen offers unmatched organic elegance and breathability during humid summer months. It naturally wrinkles and softens over time, developing an authentic relaxed patina.",
			"Himalayan wool bouclé provides rich three-dimensional texture and exceptional acoustic absorption in open-plan residences with tiled or timber floors. Natural wool lanolin repels water droplets if blotted promptly.",
			"For evening entertaining and reading corners, low-sheen combed cotton velvet provides deep, light-absorbing richness and exceptional durability exceeding 50,000 Martindale rubs."
		]
	}
];
function DesignJournal() {
	const [selectedArticle, setSelectedArticle] = useState(null);
	return /* @__PURE__ */ jsxs("section", {
		className: "design-journal showroom-extension section",
		id: "designJournal",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "section-heading",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "EDITORIAL & EXPERTISE"
				}), /* @__PURE__ */ jsx("h2", { children: "The Design Journal" })] }), /* @__PURE__ */ jsx("p", { children: "Practical guides on proportions, carpet sizing, timber stewardship, and architectural ergonomics to help you make informed interior decisions." })]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "journal-articles-grid",
				children: articles.map((art) => /* @__PURE__ */ jsxs("article", {
					className: "journal-card",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "card-topline",
							children: [/* @__PURE__ */ jsx("span", {
								className: "art-cat",
								children: art.category
							}), /* @__PURE__ */ jsx("span", {
								className: "art-time",
								children: art.readTime
							})]
						}),
						/* @__PURE__ */ jsx("h3", { children: art.title }),
						/* @__PURE__ */ jsx("p", {
							className: "art-summary",
							children: art.summary
						}),
						/* @__PURE__ */ jsx("div", {
							className: "art-key-rule",
							children: /* @__PURE__ */ jsx("strong", { children: art.keyRule })
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "text-link",
							onClick: () => setSelectedArticle(art),
							children: ["Read full guide ", /* @__PURE__ */ jsx(Icon, { name: "right" })]
						})
					]
				}, art.id))
			}),
			selectedArticle && /* @__PURE__ */ jsx("div", {
				className: "journal-modal-backdrop",
				onClick: () => setSelectedArticle(null),
				children: /* @__PURE__ */ jsxs("div", {
					className: "journal-modal-card",
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "journalModalTitle",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "modal-header",
							children: [/* @__PURE__ */ jsx("span", {
								className: "eyebrow",
								children: selectedArticle.category
							}), /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "close-button",
								"aria-label": "Close guide",
								onClick: () => setSelectedArticle(null),
								children: "✕"
							})]
						}),
						/* @__PURE__ */ jsx("h2", {
							id: "journalModalTitle",
							children: selectedArticle.title
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "modal-key-banner",
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Core Insight:" }),
								" ",
								selectedArticle.keyRule
							]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "modal-body-text",
							children: selectedArticle.content.map((p, idx) => /* @__PURE__ */ jsx("p", { children: p }, idx))
						}),
						/* @__PURE__ */ jsx("div", {
							className: "modal-footer",
							children: /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "button outline",
								onClick: () => setSelectedArticle(null),
								children: "Close guide"
							})
						})
					]
				})
			})
		]
	});
}
//#endregion
//#region src/components/AtelierCraftStory.tsx
function AtelierCraftStory() {
	const { openEnquiry } = useApp();
	return /* @__PURE__ */ jsxs("section", {
		className: "atelier-craft-story showroom-extension section",
		id: "atelier",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "section-heading",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: "MADE IN KATHMANDU"
			}), /* @__PURE__ */ jsx("h2", { children: "The Workshop & The Loom" })] }), /* @__PURE__ */ jsx("p", { children: "We do not import flat-packed compromises. Every Chandani piece is shaped by master joiners and weavers working in the Kathmandu Valley." })]
		}), /* @__PURE__ */ jsxs("div", {
			className: "craft-pillars-grid",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "pillar-card",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "pillar-image-wrap",
						children: [/* @__PURE__ */ jsx("img", {
							src: asset("without-dining-table.webp"),
							alt: "Patan timber joinery workshop",
							loading: "lazy"
						}), /* @__PURE__ */ jsx("span", {
							className: "pillar-badge",
							children: "01 / TIMBER JOINERY"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "pillar-content",
						children: [
							/* @__PURE__ */ jsx("h3", { children: "Patan Master Joinery" }),
							/* @__PURE__ */ jsx("p", { children: "Located in Lalitpur, our woodworking atelier uses traditional mortise-and-tenon construction. We season native Solid Sisau, American Walnut, and White Oak specifically for Himalayan relative humidity fluctuations." }),
							/* @__PURE__ */ jsxs("ul", {
								className: "pillar-specs",
								children: [
									/* @__PURE__ */ jsx("li", { children: "Eased bullnose edges hand-sanded to 400-grit smoothness" }),
									/* @__PURE__ */ jsx("li", { children: "Organic cold-pressed linseed and botanical wax oils" }),
									/* @__PURE__ */ jsx("li", { children: "Hidden corner splines ensuring lifetime frame stability" })
								]
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "pillar-card",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "pillar-image-wrap",
						children: [/* @__PURE__ */ jsx("img", {
							src: asset("room-chalk.webp"),
							alt: "Hand-knotted carpet loom weaving",
							loading: "lazy"
						}), /* @__PURE__ */ jsx("span", {
							className: "pillar-badge",
							children: "02 / TEXTILE FOUNDATION"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "pillar-content",
						children: [
							/* @__PURE__ */ jsx("h3", { children: "Hand-Knotted Tibetan Looms" }),
							/* @__PURE__ */ jsx("p", { children: "Woven on heavy vertical wooden looms using high-altitude sheep wool rich in natural protective lanolin. Each knot is individually looped by hand around steel rods and cut with precision shears." }),
							/* @__PURE__ */ jsxs("ul", {
								className: "pillar-specs",
								children: [
									/* @__PURE__ */ jsx("li", { children: "80-knot density providing underfoot cushioning & acoustic absorption" }),
									/* @__PURE__ */ jsx("li", { children: "Organic mineral and vegetable dye washes" }),
									/* @__PURE__ */ jsx("li", { children: "Double-warp unbleached organic cotton structural backing" })
								]
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "pillar-card",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "pillar-image-wrap",
						children: [/* @__PURE__ */ jsx("img", {
							src: asset("hero-chalk-wide.webp"),
							alt: "Baber Mahal gallery viewing salon",
							loading: "lazy"
						}), /* @__PURE__ */ jsx("span", {
							className: "pillar-badge",
							children: "03 / VIEWING SALON"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "pillar-content",
						children: [
							/* @__PURE__ */ jsx("h3", { children: "Baber Mahal Viewing Gallery" }),
							/* @__PURE__ */ jsx("p", { children: "Experience our furniture scales, timber grains, and carpet textures in person. Located in Courtyard II at Baber Mahal Revisited, open for private consultations by appointment." }),
							/* @__PURE__ */ jsxs("div", {
								className: "pillar-contact-info",
								children: [
									/* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: "Baber Mahal Revisited · Courtyard II" }) }),
									/* @__PURE__ */ jsx("p", { children: "Kathmandu 44600 · Phone: +977 1 552 4890" }),
									/* @__PURE__ */ jsx("p", { children: "Hours: Tuesday to Sunday, 10:30 AM to 6:30 PM" })
								]
							}),
							/* @__PURE__ */ jsxs("button", {
								type: "button",
								className: "button",
								onClick: () => openEnquiry("Showroom Appointment", "private", "Requesting a private viewing appointment at the Baber Mahal gallery."),
								children: ["Book a gallery visit ", /* @__PURE__ */ jsx(Icon, {})]
							})
						]
					})]
				})
			]
		})]
	});
}
//#endregion
//#region src/components/ShowroomFaq.tsx
var faqs = [
	{
		q: "Where are Chandani furniture pieces and carpets crafted?",
		a: "All joinery, cabinetry, and custom upholstery are produced in our workshop in Patan/Lalitpur by skilled master woodworkers. Our hand-knotted carpets are woven on traditional vertical looms in Kathmandu Valley using hand-spun Tibetan highland sheep wool and organic mineral-wash dyes."
	},
	{
		q: "Can dimensions, timber species, or fabrics be customized for my space?",
		a: "Yes. Because every piece is made to order rather than mass-imported, dining tables, sofas, beds, and storage units can be tailored to your room dimensions. You can select between native Solid Sisau (Indian Rosewood), American Walnut, European White Oak, and custom upholstery weaves."
	},
	{
		q: "What are the realistic production and delivery timelines?",
		a: "Selected pieces in standard sizes are ready for immediate viewing and delivery from our showroom floor. Made-to-order timber pieces typically take 3 to 5 weeks for timber seasoning, joinery, and oil curing. Custom-dimension hand-knotted rugs take 6 to 8 weeks depending on knot count and scale."
	},
	{
		q: "How does delivery and room installation work across Nepal?",
		a: "For residences in Kathmandu, Lalitpur, and Bhaktapur, our team handles direct scheduled delivery, indoor positioning, leveling, and protective packaging removal. For deliveries across Nepal (including Pokhara, Chitwan, and Biratnagar), we coordinate insured freight with specialized crate packaging."
	},
	{
		q: "How can I inspect physical wood samples and fabric weaves before deciding?",
		a: "You can visit our Baber Mahal gallery by appointment to touch real timber finishes and raw wool skeins under natural light. You can also request material samples during an initial interior design consultation."
	},
	{
		q: "What warranty and maintenance support does Chandani provide?",
		a: "All solid timber frames carry a 5-year structural joinery warranty. We also provide organic maintenance wax-oil kits and offer workshop re-polishing and professional wool rug care services throughout Kathmandu."
	}
];
function ShowroomFaq() {
	const [openIndex, setOpenIndex] = useState(0);
	const toggle = (idx) => {
		setOpenIndex(openIndex === idx ? null : idx);
	};
	return /* @__PURE__ */ jsxs("section", {
		className: "showroom-faq showroom-extension section",
		id: "faq",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "section-heading",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: "COMMERCIAL INTEGRITY & DETAILS"
			}), /* @__PURE__ */ jsx("h2", { children: "Frequently Asked Questions" })] }), /* @__PURE__ */ jsx("p", { children: "Transparent answers about production origin, custom dimensions, delivery logistics in Nepal, and long-term timber warranty." })]
		}), /* @__PURE__ */ jsx("div", {
			className: "faq-accordion-list",
			children: faqs.map((item, idx) => {
				const isOpen = openIndex === idx;
				return /* @__PURE__ */ jsxs("div", {
					className: `faq-item${isOpen ? " open" : ""}`,
					children: [/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "faq-question-btn",
						"aria-expanded": isOpen,
						onClick: () => toggle(idx),
						children: [/* @__PURE__ */ jsx("span", { children: item.q }), /* @__PURE__ */ jsx("span", {
							className: "faq-toggle-icon",
							"aria-hidden": "true",
							children: isOpen ? "−" : "+"
						})]
					}), isOpen && /* @__PURE__ */ jsx("div", {
						className: "faq-answer-pane",
						children: /* @__PURE__ */ jsx("p", { children: item.a })
					})]
				}, idx);
			})
		})]
	});
}
//#endregion
//#region src/pages/Home.tsx
var focusStyle = (p) => ({ "--focus": p.focus ?? "50%" });
function SaveButton({ id, className = "button outline", iconFirst = false, children }) {
	const { saved, products, toggleSave } = useApp();
	const on = saved.includes(id);
	return /* @__PURE__ */ jsxs(MotionButton, {
		className,
		"aria-pressed": on,
		"aria-label": `${on ? "Remove" : "Save"} ${products[id].name} ${on ? "from" : "to"} shortlist`,
		onClick: () => toggleSave(id),
		children: [
			iconFirst && /* @__PURE__ */ jsx(Icon, { name: "save" }),
			children ?? (className !== "save-button" && /* @__PURE__ */ jsx("span", { children: on ? "Saved to shortlist" : "Save to shortlist" })),
			!iconFirst && /* @__PURE__ */ jsx(Icon, { name: "save" })
		]
	});
}
function ProductCard({ product: p }) {
	const { openProduct } = useApp();
	return /* @__PURE__ */ jsxs("article", {
		className: "product-card",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "product-visual",
			children: [/* @__PURE__ */ jsx("button", {
				className: "product-image",
				onClick: () => openProduct(p.id),
				"aria-label": `Explore ${p.name}`,
				children: /* @__PURE__ */ jsx("img", {
					src: asset(p.image),
					alt: `${p.name} design concept`,
					loading: "lazy",
					style: focusStyle(p)
				})
			}), /* @__PURE__ */ jsx(SaveButton, {
				id: p.id,
				className: "save-button"
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "product-info",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: /* @__PURE__ */ jsx("button", {
				onClick: () => openProduct(p.id),
				children: p.name
			}) }), /* @__PURE__ */ jsx("p", { children: p.palette })] }), /* @__PURE__ */ jsx("button", {
				className: "icon-button",
				onClick: () => openProduct(p.id),
				"aria-label": `View ${p.name}`,
				children: /* @__PURE__ */ jsx(Icon, {})
			})]
		})]
	});
}
var filters = {
	featured: "The edit",
	all: "All pieces",
	seating: "Seating",
	carpets: "Carpets",
	dining: "Dining",
	bedroom: "Bedroom",
	lighting: "Lighting & décor",
	storage: "Storage"
};
function RoomViewActions({ onReset, onSave }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "room-view-actions",
		role: "group",
		"aria-label": "Room view actions",
		children: [/* @__PURE__ */ jsx("button", {
			type: "button",
			className: "text-link",
			onClick: onReset,
			"aria-label": "Reset room view",
			children: "Reset view"
		}), /* @__PURE__ */ jsxs("button", {
			type: "button",
			className: "text-link",
			onClick: onSave,
			children: ["Save room selections ", /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				children: "↗"
			})]
		})]
	});
}
var roomLabels = {
	living: "Living room",
	kitchen: "Kitchen",
	bedroom: "Bedroom",
	dining: "Dining"
};
function RoomExplorer() {
	const { content, products, query, openProduct, openEnquiry, openTry, tryEntry, saveConfiguration } = useApp();
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const requestedRoom = params.get("room");
	const exploring = !!requestedRoom && Object.hasOwn(content.rooms, requestedRoom);
	const roomId = exploring ? requestedRoom : "living";
	const room = content.rooms[roomId];
	const { status, revision, retry } = useImagePair(room.image, room.image);
	const index = Math.max(0, room.items.findIndex((item) => (item.product ?? item.id) === params.get("piece")));
	const item = room.items[index];
	const product = item.product ? products[item.product] : void 0;
	const exploreButton = useRef(null);
	const firstHotspot = useRef(null);
	const focusAfterLoad = useRef(false);
	const returnToExplore = useRef(false);
	useEffect(() => {
		if (exploring && status === "ready" && focusAfterLoad.current) {
			focusAfterLoad.current = false;
			if (document.activeElement === exploreButton.current || document.activeElement === document.body || document.activeElement?.closest(".scene-photo .try-loading")) firstHotspot.current?.focus({ preventScroll: true });
		}
	}, [status, exploring]);
	useEffect(() => {
		if (!exploring && returnToExplore.current) {
			returnToExplore.current = false;
			exploreButton.current?.focus({ preventScroll: true });
		}
	}, [exploring]);
	const explore = (id) => query({
		room: id,
		piece: null
	}, "#home-room");
	return /* @__PURE__ */ jsxs("section", {
		className: "home-room",
		id: "home-room",
		"aria-label": "Explore a Chandani home",
		children: [/* @__PURE__ */ jsxs("div", {
			className: `scene${exploring ? " exploring" : ""}`,
			id: "scene",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "scene-photo",
					id: "scenePhoto",
					children: [
						/* @__PURE__ */ jsx(CrossfadeImage, {
							ready: status === "ready",
							revision,
							id: "sceneImage",
							src: asset(room.image),
							width: "1919",
							height: "820",
							fetchPriority: "high",
							alt: exploring ? room.alt : "A light living room with an ivory sofa, a bordered rug and a sculptural side table"
						}),
						exploring && status !== "ready" && /* @__PURE__ */ jsxs("div", {
							className: "try-loading",
							role: "status",
							children: [/* @__PURE__ */ jsx("span", { children: status === "error" ? "The room photograph could not load." : `Loading ${room.label.toLowerCase()}…` }), status === "error" && /* @__PURE__ */ jsx("button", {
								onClick: () => {
									focusAfterLoad.current = true;
									retry();
								},
								children: "Try again"
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "hotspots",
							id: "hotspots",
							hidden: !exploring,
							children: room.items.map((hotspot, i) => /* @__PURE__ */ jsxs("button", {
								ref: i === 0 ? firstHotspot : void 0,
								disabled: status !== "ready",
								className: "hotspot",
								style: {
									"--x": `${hotspot.x}%`,
									"--y": `${hotspot.y}%`
								},
								"aria-label": `Explore ${hotspot.label.toLowerCase()}`,
								"aria-pressed": i === index,
								onClick: () => query({ piece: hotspot.product ?? hotspot.id }, void 0, true),
								children: [/* @__PURE__ */ jsx("span", {
									className: "pin",
									children: String(i + 1).padStart(2, "0")
								}), /* @__PURE__ */ jsx("span", {
									className: "pin-label",
									children: hotspot.label
								})]
							}, hotspot.product ?? hotspot.id))
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "scene-topline",
							id: "sceneTopline",
							hidden: !exploring,
							children: [/* @__PURE__ */ jsxs("span", { children: [
								room.number,
								" / ",
								room.label.toUpperCase()
							] }), /* @__PURE__ */ jsx("button", {
								"aria-label": "Return to introduction",
								onClick: () => {
									returnToExplore.current = true;
									query({
										room: null,
										piece: null
									});
								},
								children: "Close room view ×"
							})]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "hero-copy",
					id: "heroCopy",
					hidden: exploring,
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "eyebrow",
							children: "FURNITURE, CARPETS & INTERIORS"
						}),
						/* @__PURE__ */ jsxs("h1", { children: [
							"A home,",
							/* @__PURE__ */ jsx("br", {}),
							"in your",
							/* @__PURE__ */ jsx("br", {}),
							/* @__PURE__ */ jsx("em", { children: "own way." })
						] }),
						/* @__PURE__ */ jsx("p", { children: "From the sofa you sink into to the kitchen you gather in. Find what makes a space yours." }),
						/* @__PURE__ */ jsxs(MotionButton, {
							className: "button",
							ref: exploreButton,
							onClick: () => {
								focusAfterLoad.current = true;
								explore("living");
							},
							children: ["Explore this room ", /* @__PURE__ */ jsx(Icon, {})]
						}),
						/* @__PURE__ */ jsxs("a", {
							className: "text-link",
							href: "#categories",
							children: ["Discover the collection ", /* @__PURE__ */ jsx("span", { children: "↓" })]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "scene-card",
					id: "sceneCard",
					hidden: !exploring,
					"aria-live": "polite",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "eyebrow",
						children: [
							room.label.toUpperCase(),
							" / ",
							String(index + 1).padStart(2, "0")
						]
					}), product ? /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsx("h3", { children: product.name }),
						/* @__PURE__ */ jsx("p", { children: product.text }),
						/* @__PURE__ */ jsxs("button", {
							className: "button",
							onClick: () => openProduct(product.id),
							children: ["Explore the piece ", /* @__PURE__ */ jsx(Icon, {})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "scene-small-actions",
							children: [/* @__PURE__ */ jsx(SaveButton, {
								id: product.id,
								className: "",
								iconFirst: true
							}), product.category === "carpets" ? /* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => openTry(product.id, "living"),
								children: "Compare colours ↗"
							}) : /* @__PURE__ */ jsx("button", {
								onClick: () => openEnquiry(product.name),
								children: "Enquire ↗"
							})]
						})
					] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsx("h3", { children: item.title }),
						/* @__PURE__ */ jsx("p", { children: item.text }),
						/* @__PURE__ */ jsxs("button", {
							className: "button",
							onClick: () => openEnquiry(item.interest),
							children: ["Discuss this idea ", /* @__PURE__ */ jsx(Icon, {})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "scene-small-actions",
							children: /* @__PURE__ */ jsx("a", {
								href: "#kitchens",
								children: "About kitchen design ↓"
							})
						})
					] })]
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: `room-toolbar${exploring ? " has-view-actions" : ""}`,
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "room-intro",
					children: [/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "A DIFFERENT WAY TO EXPLORE"
					}), /* @__PURE__ */ jsx("span", { children: "Start with a room." })]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "room-tabs",
					"aria-label": "Choose a room",
					children: Object.keys(content.rooms).map((id) => /* @__PURE__ */ jsxs("button", {
						onClick: () => explore(id),
						"aria-pressed": id === roomId,
						children: [
							/* @__PURE__ */ jsx("span", { children: content.rooms[id].number }),
							" ",
							roomLabels[id]
						]
					}, id))
				}),
				/* @__PURE__ */ jsxs(MotionButton, {
					className: "room-hint try-room-launch",
					onClick: () => openTry(void 0, roomId),
					"aria-haspopup": "dialog",
					"aria-expanded": !!tryEntry,
					children: ["Try the room ", /* @__PURE__ */ jsx(Icon, {})]
				}),
				exploring && /* @__PURE__ */ jsx(RoomViewActions, {
					onReset: () => explore(roomId),
					onSave: saveConfiguration
				})
			]
		})]
	});
}
var categories = [
	{
		id: "seating",
		title: "Sofas & seating",
		sub: "Make yourself comfortable",
		image: "sofa.webp",
		className: "sofa"
	},
	{
		id: "carpets",
		title: "Carpets",
		sub: "Give the room its foundation",
		image: "product-clay.webp",
		className: "rug"
	},
	{
		id: "bedroom",
		title: "Bedroom",
		sub: "Make space to slow down",
		image: "bedroom.webp",
		className: "bedroom"
	},
	{
		id: "dining",
		title: "Dining",
		sub: "For everyday gatherings",
		image: "dining.webp",
		className: "dining"
	}
];
function CategoryDirectory() {
	const { query } = useApp();
	return /* @__PURE__ */ jsxs(RevealSection, {
		className: "categories section",
		id: "categories",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "section-heading",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "THE CHANDANI HOME"
				}), /* @__PURE__ */ jsxs("h2", { children: [
					"One piece.",
					/* @__PURE__ */ jsx("br", {}),
					"Or a whole new perspective."
				] })] }), /* @__PURE__ */ jsxs("p", { children: [
					"Some things bring a room together.",
					/* @__PURE__ */ jsx("br", {}),
					"Others become the reason for the room.",
					/* @__PURE__ */ jsx("br", {}),
					"Find your starting point."
				] })]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "category-grid",
				children: categories.map((c) => /* @__PURE__ */ jsxs("button", {
					className: "category",
					onClick: () => query({ category: c.id }, "#collection"),
					children: [
						/* @__PURE__ */ jsx("div", {
							className: `category-image ${c.className}`,
							children: /* @__PURE__ */ jsx("img", {
								src: asset(c.image),
								loading: "lazy",
								alt: `${c.title} design concept`
							})
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "category-title",
							children: [c.title, /* @__PURE__ */ jsx(Icon, {})]
						}),
						/* @__PURE__ */ jsx("span", {
							className: "category-sub",
							children: c.sub
						})
					]
				}, c.id))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "category-more",
				children: [
					/* @__PURE__ */ jsx("span", { children: "And the details that finish it." }),
					/* @__PURE__ */ jsxs("button", {
						onClick: () => query({ category: "lighting" }, "#collection"),
						children: ["Lighting & décor ", /* @__PURE__ */ jsx(Icon, {})]
					}),
					/* @__PURE__ */ jsxs("button", {
						onClick: () => query({ category: "storage" }, "#collection"),
						children: ["Storage ", /* @__PURE__ */ jsx(Icon, {})]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: "#kitchens",
						children: ["Kitchen design ", /* @__PURE__ */ jsx(Icon, {})]
					})
				]
			})
		]
	});
}
function ProductCollection() {
	const { content, query } = useApp();
	const location = useLocation();
	const category = new URLSearchParams(location.search).get("category") ?? "featured";
	const filter = Object.hasOwn(filters, category) ? category : "featured";
	const list = content.products.filter((p) => filter === "all" || (filter === "featured" ? p.featured : p.category === filter));
	return /* @__PURE__ */ jsxs(RevealSection, {
		className: "collection section",
		id: "collection",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "section-heading",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "AN ILLUSTRATIVE COLLECTION"
				}), /* @__PURE__ */ jsx("h2", { children: "Pieces to make it yours." })] }), /* @__PURE__ */ jsxs("button", {
					className: "text-link",
					onClick: () => query({ category: "all" }),
					children: ["Explore all pieces ", /* @__PURE__ */ jsx(Icon, { name: "right" })]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "collection-bar",
				children: [/* @__PURE__ */ jsx("div", {
					className: "filters",
					"aria-label": "Filter the collection",
					children: Object.entries(filters).map(([id, label]) => /* @__PURE__ */ jsx("button", {
						onClick: () => query({ category: id }),
						"aria-pressed": filter === id,
						children: label
					}, id))
				}), /* @__PURE__ */ jsxs("span", {
					id: "resultCount",
					"aria-live": "polite",
					children: [list.length, " pieces"]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "product-grid",
				id: "productGrid",
				children: list.map((p) => /* @__PURE__ */ jsx(ProductCard, { product: p }, p.id))
			})
		]
	});
}
function KitchenFeature() {
	const { openEnquiry, query } = useApp();
	return /* @__PURE__ */ jsxs(RevealSection, {
		className: "kitchen-section",
		id: "kitchens",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "kitchen-image",
			children: [/* @__PURE__ */ jsx("img", {
				src: asset("kitchen.webp"),
				width: "1881",
				height: "836",
				loading: "lazy",
				alt: "Kitchen design concept with a walnut island, stone-style worktop and green cabinetry"
			}), /* @__PURE__ */ jsx("span", {
				className: "image-caption",
				children: "A KITCHEN DESIGN STUDY"
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "kitchen-copy",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "KITCHEN DESIGN / CHANDANI"
				}),
				/* @__PURE__ */ jsxs("h2", { children: [
					"Made around",
					/* @__PURE__ */ jsx("br", {}),
					"the way",
					/* @__PURE__ */ jsx("br", {}),
					/* @__PURE__ */ jsx("em", { children: "you live." })
				] }),
				/* @__PURE__ */ jsx("p", { children: "A place to cook. To catch up. To come together. Start with your space, then explore the layout, storage and finishes that feel right." }),
				/* @__PURE__ */ jsxs(MotionButton, {
					className: "button light",
					onClick: () => openEnquiry("Kitchen design"),
					children: ["Let’s plan your kitchen ", /* @__PURE__ */ jsx(Icon, {})]
				}),
				/* @__PURE__ */ jsxs("button", {
					className: "text-link",
					onClick: () => query({
						room: "kitchen",
						piece: null
					}, "#home-room"),
					children: ["Explore the kitchen concept ", /* @__PURE__ */ jsx(Icon, { name: "right" })]
				})
			]
		})]
	});
}
function Home() {
	const { openEnquiry } = useApp();
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(RoomExplorer, {}),
		/* @__PURE__ */ jsx(CategoryDirectory, {}),
		/* @__PURE__ */ jsx(CuratedCollections, {}),
		/* @__PURE__ */ jsx(ShopByRoom, {}),
		/* @__PURE__ */ jsxs("section", {
			className: "showroom-interactive-duo showroom-extension section",
			id: "interactiveShowcase",
			children: [/* @__PURE__ */ jsx(MaterialsExplorer, {}), /* @__PURE__ */ jsx(PlanningAssistant, {})]
		}),
		/* @__PURE__ */ jsx("section", {
			className: "showroom-studio-wrapper showroom-extension section",
			id: "studioEnsemble",
			children: /* @__PURE__ */ jsx(RoomStudio, {})
		}),
		/* @__PURE__ */ jsx(ProductCollection, {}),
		/* @__PURE__ */ jsx(KitchenFeature, {}),
		/* @__PURE__ */ jsx(DesignJournal, {}),
		/* @__PURE__ */ jsx(AtelierCraftStory, {}),
		/* @__PURE__ */ jsx(ShowroomFaq, {}),
		/* @__PURE__ */ jsxs(RevealSection, {
			className: "planning section",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "planning-title",
				children: [/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "FROM AN IDEA TO A SPACE"
				}), /* @__PURE__ */ jsxs("h2", { children: [
					"A little guidance.",
					/* @__PURE__ */ jsx("br", {}),
					"A home that feels like you."
				] })]
			}), /* @__PURE__ */ jsxs("div", {
				className: "planning-steps",
				children: [
					/* @__PURE__ */ jsxs("article", { children: [
						/* @__PURE__ */ jsx("span", { children: "01" }),
						/* @__PURE__ */ jsx("h3", { children: "Bring your space." }),
						/* @__PURE__ */ jsx("p", { children: "A room, a rough measurement, a few ideas. Start with what you have." })
					] }),
					/* @__PURE__ */ jsxs("article", { children: [
						/* @__PURE__ */ jsx("span", { children: "02" }),
						/* @__PURE__ */ jsx("h3", { children: "Explore the possibilities." }),
						/* @__PURE__ */ jsx("p", { children: "Look at pieces, palettes and layouts together, in the context of your home." })
					] }),
					/* @__PURE__ */ jsxs("article", { children: [
						/* @__PURE__ */ jsx("span", { children: "03" }),
						/* @__PURE__ */ jsx("h3", { children: "Make it your own." }),
						/* @__PURE__ */ jsx("p", { children: "Bring your favourites together and discuss the details with Chandani." })
					] })
				]
			})]
		}),
		/* @__PURE__ */ jsxs(RevealSection, {
			className: "contact section",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: "LET’S BEGIN"
			}), /* @__PURE__ */ jsxs("h2", { children: [
				"Your next chapter",
				/* @__PURE__ */ jsx("br", {}),
				"starts at home."
			] })] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", { children: [
				"One room or the whole home.",
				/* @__PURE__ */ jsx("br", {}),
				"Tell us what you have in mind."
			] }), /* @__PURE__ */ jsxs(MotionButton, {
				className: "button",
				onClick: () => openEnquiry("Whole home"),
				children: ["Start a conversation ", /* @__PURE__ */ jsx(Icon, {})]
			})] })]
		})
	] });
}
//#endregion
//#region src/data/rendering.ts
/** Capability-limited renderer: these are opaque studies, never independently composited models. */
function getRoomRenderPlan(configuration, room) {
	if (room === "living") {
		const carpet = configuration.rooms.living.carpet;
		return {
			kind: "flat-study",
			image: carpet === "bare" ? "room-empty.webp" : `room-${carpet}.webp`,
			alt: carpet === "bare" ? "Carpet study with bare floor and fixed furniture" : `Carpet study with ${carpet} carpet and fixed furniture`,
			view: "carpet-study"
		};
	}
	return {
		kind: "flat-study",
		image: `${room}.webp`,
		alt: `${room} room study with the sample furniture`,
		view: "room-study"
	};
}
//#endregion
//#region src/components/ProductAccordion.tsx
function ProductAccordion({ details }) {
	const [openId, setOpenId] = useState(null);
	const prefix = useId();
	const reduceMotion = useMotionPreference();
	return /* @__PURE__ */ jsx("div", {
		className: "product-details",
		children: details.map((detail) => {
			const isOpen = openId === detail.id;
			const buttonId = `${prefix}-${detail.id}-button`;
			const panelId = `${prefix}-${detail.id}-panel`;
			return /* @__PURE__ */ jsxs("div", {
				className: "product-details__item",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "product-details__heading",
					children: /* @__PURE__ */ jsxs("button", {
						id: buttonId,
						type: "button",
						className: "product-details__trigger",
						"aria-expanded": isOpen,
						"aria-controls": panelId,
						onClick: () => setOpenId(isOpen ? null : detail.id),
						children: [detail.title, /* @__PURE__ */ jsx("span", {
							className: "product-details__icon",
							"aria-hidden": "true",
							children: isOpen ? "−" : "+"
						})]
					})
				}), /* @__PURE__ */ jsx("div", {
					id: panelId,
					role: "region",
					"aria-labelledby": buttonId,
					hidden: !isOpen,
					children: /* @__PURE__ */ jsx(AnimatePresence, {
						initial: false,
						children: isOpen && /* @__PURE__ */ jsx(m.div, {
							initial: reduceMotion ? false : {
								opacity: 0,
								y: 6
							},
							animate: {
								opacity: 1,
								y: 0
							},
							transition: { duration: reduceMotion ? 0 : .2 },
							children: typeof detail.content === "string" ? /* @__PURE__ */ jsx("p", {
								className: "product-details__content",
								children: detail.content
							}) : /* @__PURE__ */ jsx("div", {
								className: "product-details__content",
								children: detail.content
							})
						}, detail.id)
					})
				})]
			}, detail.id);
		})
	});
}
//#endregion
//#region src/components/Products.tsx
function ProductDetails({ id }) {
	const { content, products, openProduct, openEnquiry, openTry } = useApp();
	const p = products[id];
	const roomImage = p.category === "carpets" ? `room-${p.id}.webp` : content.rooms[p.scene]?.image ?? p.image;
	const gallery = p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages : [{
		src: p.image,
		label: "Studio portrait",
		alt: `${p.name} studio portrait`
	}, {
		src: roomImage,
		label: "Room context",
		alt: `${p.name} in room context`
	}];
	const [galleryIndex, setGalleryIndex] = useState(0);
	const activeImage = gallery[galleryIndex] ?? gallery[0];
	const related = (p.relatedIds ?? []).map((relId) => products[relId]).filter(Boolean);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("div", {
			className: "drawer-image",
			children: /* @__PURE__ */ jsx("img", {
				src: asset(activeImage.src),
				alt: activeImage.alt,
				style: galleryIndex === 0 ? focusStyle(p) : void 0
			})
		}),
		/* @__PURE__ */ jsx("div", {
			className: "product-gallery-thumbnails",
			role: "group",
			"aria-label": "Product photography angles",
			children: gallery.map((img, i) => /* @__PURE__ */ jsxs("button", {
				type: "button",
				className: `gallery-thumb-btn${galleryIndex === i ? " active" : ""}`,
				"aria-pressed": galleryIndex === i,
				onClick: () => setGalleryIndex(i),
				"aria-label": img.label,
				children: [/* @__PURE__ */ jsx("img", {
					src: asset(img.src),
					alt: ""
				}), /* @__PURE__ */ jsx("span", { children: img.label })]
			}, img.src + i))
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "product-title-row",
			children: [/* @__PURE__ */ jsx("h2", {
				id: "drawerTitle",
				children: p.name
			}), p.availability && /* @__PURE__ */ jsxs("span", {
				className: "product-availability-tag",
				children: ["● ", p.availability.split("·")[0].trim()]
			})]
		}),
		/* @__PURE__ */ jsx("p", { children: p.text }),
		p.dimensions && /* @__PURE__ */ jsxs("div", {
			className: "product-quick-specs",
			"aria-label": "Key dimensions",
			children: [
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Width" }), /* @__PURE__ */ jsx("strong", { children: p.dimensions.width })] }),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Depth" }), /* @__PURE__ */ jsx("strong", { children: p.dimensions.depth })] }),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Height" }), /* @__PURE__ */ jsx("strong", { children: p.dimensions.height })] }),
				p.dimensions.seatHeight && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Seat" }), /* @__PURE__ */ jsx("strong", { children: p.dimensions.seatHeight })] }),
				p.dimensions.weight && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Weight" }), /* @__PURE__ */ jsx("strong", { children: p.dimensions.weight })] })
			]
		}),
		/* @__PURE__ */ jsxs("dl", {
			className: "detail-specs",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", { children: "PALETTE" }), /* @__PURE__ */ jsx("dd", { children: p.palette })] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", { children: "COLLECTION" }), /* @__PURE__ */ jsx("dd", { children: p.type })] })]
		}),
		/* @__PURE__ */ jsx(ProductAccordion, { details: [
			{
				id: "materials",
				title: "Materials & finish",
				content: /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs("p", { children: [
						/* @__PURE__ */ jsx("strong", { children: "Finish & palette:" }),
						" ",
						p.finishDetails ?? p.palette
					] }),
					p.materialsList && /* @__PURE__ */ jsx("ul", { children: p.materialsList.map((item, idx) => /* @__PURE__ */ jsx("li", { children: item }, idx)) }),
					/* @__PURE__ */ jsxs("p", {
						className: "fineprint",
						children: [
							"Illustrative palette: ",
							p.palette,
							". Final materials and finishes will be confirmed with Chandani."
						]
					})
				] })
			},
			{
				id: "dimensions",
				title: "Dimensions & scale",
				content: p.dimensions ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("table", { children: /* @__PURE__ */ jsxs("tbody", { children: [
					/* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Width" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.width })] }),
					/* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Depth" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.depth })] }),
					/* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Height" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.height })] }),
					p.dimensions.seatHeight && /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Seat Height" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.seatHeight })] }),
					p.dimensions.clearance && /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Clearance" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.clearance })] }),
					p.dimensions.weight && /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Weight" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.weight })] })
				] }) }), /* @__PURE__ */ jsx("p", {
					className: "fineprint",
					children: "Exact dimensions will be confirmed with Chandani. Include your room measurements in the enquiry."
				})] }) : /* @__PURE__ */ jsx("p", { children: "Exact dimensions will be confirmed with Chandani. Include your room measurements in the enquiry." })
			},
			{
				id: "care",
				title: "Care instructions",
				content: p.careInstructions ? /* @__PURE__ */ jsx("ul", { children: p.careInstructions.map((item, idx) => /* @__PURE__ */ jsx("li", { children: item }, idx)) }) : /* @__PURE__ */ jsx("p", { children: "Ask Chandani for care guidance for the confirmed material and finish." })
			},
			{
				id: "availability",
				title: "Availability & lead time",
				content: /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs("p", { children: [
						/* @__PURE__ */ jsx("strong", { children: "Timeline:" }),
						" ",
						p.availability ?? "Made to order in Kathmandu · 3–5 weeks"
					] }),
					/* @__PURE__ */ jsx("p", { children: "Joinery pieces and custom upholstery are made to order in our Kathmandu Valley workshop, with select pieces available for immediate inspection and delivery from our showroom floor." }),
					/* @__PURE__ */ jsx("p", {
						className: "fineprint",
						children: "Custom sizing, finish adjustments, and fabric selections are confirmed directly with your design advisor before production."
					})
				] })
			},
			{
				id: "delivery",
				title: "Delivery & room placement",
				content: /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", { children: [
					/* @__PURE__ */ jsx("strong", { children: "Delivery service:" }),
					" ",
					p.deliveryInfo ?? "Direct delivery and placement in Kathmandu Valley"
				] }), /* @__PURE__ */ jsxs("ul", { children: [
					/* @__PURE__ */ jsx("li", { children: "Scheduled delivery window with dedicated team" }),
					/* @__PURE__ */ jsx("li", { children: "Careful placement inside your room of choice" }),
					/* @__PURE__ */ jsx("li", { children: "Assembly, unboxing, leveling, and hardware checks" }),
					/* @__PURE__ */ jsx("li", { children: "Outside Kathmandu Valley delivery coordinated with insured transport partners" })
				] })] })
			}
		] }),
		/* @__PURE__ */ jsxs(MotionButton, {
			className: "button",
			onClick: () => openEnquiry(p.name),
			children: ["Enquire about this piece ", /* @__PURE__ */ jsx(Icon, {})]
		}),
		/* @__PURE__ */ jsx(SaveButton, { id }),
		p.category === "carpets" ? /* @__PURE__ */ jsxs(SiteLink, {
			className: "text-link",
			to: `/carpet-studio?rug=${p.id}`,
			children: ["Compare it in the carpet studio ", /* @__PURE__ */ jsx(Icon, {})]
		}) : /* @__PURE__ */ jsxs(SiteLink, {
			className: "text-link",
			to: `/?room=${p.scene}&piece=${p.id}#home-room`,
			children: ["Explore the room inspiration ", /* @__PURE__ */ jsx(Icon, {})]
		}),
		/* @__PURE__ */ jsxs(MotionButton, {
			className: "button outline",
			onClick: () => openTry(p.id),
			"aria-haspopup": "dialog",
			children: ["Try in the room ", /* @__PURE__ */ jsx(Icon, {})]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "product-drawer-perks",
			role: "group",
			"aria-label": "Atelier services",
			children: [/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "quick-perk-chip",
				onClick: () => openEnquiry(p.name, "swatch", `Requesting physical material and finish samples for ${p.name}.`),
				children: /* @__PURE__ */ jsx("span", { children: "Material & Finish Samples" })
			}), /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "quick-perk-chip",
				onClick: () => openEnquiry(p.name, "trade", `Trade & designer enquiry for ${p.name}: requesting technical dimensions, finish options, and collaboration terms.`),
				children: /* @__PURE__ */ jsx("span", { children: "Architecture & Interior Collaboration" })
			})]
		}),
		related.length > 0 && /* @__PURE__ */ jsxs("div", {
			className: "product-related-section",
			children: [/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: "COORDINATING PIECES"
			}), /* @__PURE__ */ jsx("div", {
				className: "product-related-list",
				children: related.map((rel) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "product-related-card",
					onClick: () => openProduct(rel.id),
					"aria-label": `View ${rel.name}`,
					children: [/* @__PURE__ */ jsx("img", {
						src: asset(rel.image),
						alt: rel.name,
						loading: "lazy"
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: rel.name }), /* @__PURE__ */ jsx("small", { children: rel.palette })] })]
				}, rel.id))
			})]
		}),
		/* @__PURE__ */ jsx("p", {
			className: "fineprint",
			children: "Illustrative design concept. Final products, dimensions, materials and pricing will be confirmed with Chandani."
		})
	] });
}
function Shortlist() {
	const { saved, products, openProduct, toggleSave, openEnquiry, savedConfiguration, openTry } = useApp();
	const [removedId, setRemovedId] = useState(null);
	function handleRemoveFromShortlist(productId) {
		toggleSave(productId);
		setRemovedId(productId);
	}
	function handleShareShortlist() {
		const shareUrl = `${window.location.origin}${window.location.pathname}?saved=${saved.join(",")}`;
		if (navigator.clipboard?.writeText) navigator.clipboard.writeText(shareUrl).then(() => {
			toast.success("Shortlist link copied to clipboard", { description: `${saved.length} pieces included in share link.` });
		}).catch(() => {
			toast.info(`Share link: ${shareUrl}`);
		});
		else toast.info(`Share link: ${shareUrl}`);
	}
	function handleClearAll() {
		const previousSaved = [...saved];
		previousSaved.forEach((id) => toggleSave(id));
		toast("Shortlist cleared", { action: {
			label: "Undo",
			onClick: () => {
				previousSaved.forEach((id) => {
					toggleSave(id);
				});
			}
		} });
	}
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("h2", {
			id: "drawerTitle",
			children: "Your shortlist."
		}),
		/* @__PURE__ */ jsx("p", { children: "Bring your favourite pieces together." }),
		removedId && /* @__PURE__ */ jsxs("div", {
			className: "shortlist-undo",
			children: [/* @__PURE__ */ jsxs("span", {
				role: "status",
				children: [products[removedId].name, " removed from shortlist."]
			}), /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "text-link",
				onClick: () => {
					if (!saved.includes(removedId)) toggleSave(removedId);
					setRemovedId(null);
				},
				children: "Undo removal"
			})]
		}),
		saved.length ? /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsxs("div", {
				className: "shortlist-meta-bar",
				children: [/* @__PURE__ */ jsxs("span", {
					className: "shortlist-count-badge",
					children: [
						saved.length,
						" ",
						saved.length === 1 ? "curated piece" : "curated pieces"
					]
				}), /* @__PURE__ */ jsx("span", {
					className: "shortlist-readiness-pill",
					children: "● Consultation ready"
				})]
			}),
			saved.map((id) => {
				const p = products[id];
				return /* @__PURE__ */ jsxs("article", {
					className: "shortlist-row",
					children: [
						/* @__PURE__ */ jsx("button", {
							onClick: () => openProduct(id),
							"aria-label": `View ${p.name}`,
							children: /* @__PURE__ */ jsx("img", {
								src: asset(p.image),
								style: focusStyle(p),
								alt: p.name
							})
						}),
						/* @__PURE__ */ jsxs("button", {
							onClick: () => openProduct(id),
							children: [/* @__PURE__ */ jsx("strong", { children: p.name }), /* @__PURE__ */ jsx("small", { children: p.type })]
						}),
						/* @__PURE__ */ jsx("button", {
							className: "remove",
							onClick: () => handleRemoveFromShortlist(id),
							"aria-label": `Remove ${p.name}`,
							children: "×"
						})
					]
				}, id);
			}),
			/* @__PURE__ */ jsxs("button", {
				className: "button",
				onClick: () => openEnquiry("My shortlist"),
				children: ["Enquire about your selection ", /* @__PURE__ */ jsx(Icon, {})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "shortlist-secondary-actions",
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "button outline",
					onClick: handleShareShortlist,
					children: "Share shortlist link ↗"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "text-link shortlist-clear-btn",
					onClick: handleClearAll,
					children: "Clear all"
				})]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "fineprint",
				children: "Your selection is saved in this browser. Shareable link encodes your exact selection."
			})
		] }) : /* @__PURE__ */ jsxs("div", {
			className: "empty-panel",
			children: [/* @__PURE__ */ jsx("p", { children: "See something that feels like you? Save it with the bookmark beside each piece." }), /* @__PURE__ */ jsxs(SiteLink, {
				className: "button",
				to: "/#collection",
				children: ["Explore the collection ", /* @__PURE__ */ jsx(Icon, {})]
			})]
		}),
		savedConfiguration && /* @__PURE__ */ jsxs("section", {
			className: "shortlist-saved-scheme",
			"aria-label": "Saved room scheme",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "shortlist-scheme-header",
				children: [/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "SAVED ROOM SCHEME"
				}), /* @__PURE__ */ jsx("h3", { children: "Living room composition" })]
			}), /* @__PURE__ */ jsxs("div", {
				className: "shortlist-scheme-card",
				children: [/* @__PURE__ */ jsx("img", {
					src: asset(getRoomRenderPlan(savedConfiguration, "living").image),
					alt: "Saved living room composition"
				}), /* @__PURE__ */ jsxs("div", {
					className: "shortlist-scheme-details",
					children: [/* @__PURE__ */ jsxs("p", { children: ["Carpet: ", /* @__PURE__ */ jsx("strong", { children: savedConfiguration.rooms.living.carpet ?? "Default" })] }), /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "button outline",
						onClick: () => openTry(void 0, "living"),
						children: ["Explore in room ", /* @__PURE__ */ jsx(Icon, {})]
					})]
				})]
			})]
		})
	] });
}
function Search() {
	const { content, openProduct, openEnquiry, closePanel } = useApp();
	const [query, setQuery] = useState("");
	const result = searchCatalogue(content.products, query);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("h2", {
			id: "drawerTitle",
			children: "Find your starting point."
		}),
		/* @__PURE__ */ jsxs("label", {
			className: "search-field",
			children: [
				/* @__PURE__ */ jsx(Icon, { name: "search" }),
				/* @__PURE__ */ jsx("input", {
					autoFocus: true,
					type: "search",
					value: query,
					onChange: (e) => setQuery(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Escape") {
							e.preventDefault();
							closePanel();
						}
					},
					placeholder: "Try sofa, carpet, kitchen…",
					"aria-label": "Search products and kitchen design",
					autoComplete: "off"
				}),
				query && /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "search-clear-btn",
					onClick: () => setQuery(""),
					"aria-label": "Clear search",
					children: "×"
				})
			]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "search-suggestions",
			role: "group",
			"aria-label": "Suggested searches",
			children: [/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: "POPULAR SEARCHES"
			}), /* @__PURE__ */ jsx("div", {
				className: "search-chip-group",
				children: [
					"Sofa",
					"Carpet",
					"Dining table",
					"Bed",
					"Kitchen",
					"Oak",
					"Walnut",
					"Bouclé"
				].map((item) => /* @__PURE__ */ jsx("button", {
					type: "button",
					className: `search-chip${query.toLowerCase() === item.toLowerCase() ? " active" : ""}`,
					onClick: () => setQuery(query.toLowerCase() === item.toLowerCase() ? "" : item),
					children: item
				}, item))
			})]
		}),
		/* @__PURE__ */ jsxs("div", {
			id: "searchResults",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "search-count",
					role: "status",
					children: [result.products.length + Number(result.kitchen), " results"]
				}),
				result.kitchen && /* @__PURE__ */ jsxs("article", {
					className: "search-row",
					children: [
						/* @__PURE__ */ jsx("button", {
							onClick: () => openEnquiry("Kitchen design"),
							"aria-label": "Explore kitchen design",
							children: /* @__PURE__ */ jsx("img", {
								src: asset("kitchen.webp"),
								alt: "Kitchen design"
							})
						}),
						/* @__PURE__ */ jsxs("button", {
							onClick: () => openEnquiry("Kitchen design"),
							children: [/* @__PURE__ */ jsx("strong", { children: "Kitchen design" }), /* @__PURE__ */ jsx("small", { children: "Start with your space" })]
						}),
						/* @__PURE__ */ jsx(SiteLink, {
							className: "icon-button",
							to: "/?room=kitchen#home-room",
							"aria-label": "View kitchen concept",
							children: /* @__PURE__ */ jsx(Icon, {})
						})
					]
				}),
				result.products.map((p) => /* @__PURE__ */ jsxs("article", {
					className: "search-row",
					children: [
						/* @__PURE__ */ jsx("button", {
							onClick: () => openProduct(p.id),
							"aria-label": `View ${p.name}`,
							children: /* @__PURE__ */ jsx("img", {
								src: asset(p.image),
								style: focusStyle(p),
								alt: p.name
							})
						}),
						/* @__PURE__ */ jsxs("button", {
							onClick: () => openProduct(p.id),
							children: [/* @__PURE__ */ jsx("strong", { children: p.name }), /* @__PURE__ */ jsx("small", { children: p.type })]
						}),
						/* @__PURE__ */ jsx("button", {
							className: "icon-button",
							onClick: () => openProduct(p.id),
							"aria-label": `View details of ${p.name}`,
							children: /* @__PURE__ */ jsx(Icon, {})
						})
					]
				}, p.id)),
				!result.kitchen && !result.products.length && /* @__PURE__ */ jsx("p", {
					className: "collection-empty",
					children: "No matches yet. Try a broader term, such as sofa, bed or carpet."
				})
			]
		})
	] });
}
//#endregion
//#region src/components/GlassSurface.tsx
/**
* Adapted from React Bits Glass Surface (SVG renderer), David Haz, 2026.
* Source and full MIT + Commons Clause terms: docs/REACT-BITS-LICENSE.md.
* Scoped to a single, static rounded toolbar. No WebGL or animated refraction.
*/
function GlassSurface({ children }) {
	const ref = useRef(null);
	const id = `room-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
	const reduced = useMotionPreference();
	const [supported, setSupported] = useState(false);
	const [size, setSize] = useState({
		width: 0,
		height: 0
	});
	useEffect(() => {
		const ua = navigator.userAgent;
		setSupported(!/Firefox/.test(ua) && !(/Safari/.test(ua) && !/Chrome/.test(ua)) && CSS.supports("backdrop-filter", `url(#${id})`));
	}, [id]);
	useEffect(() => {
		const element = ref.current;
		if (!element || reduced || !supported) return;
		const measure = () => setSize((previous) => {
			const width = element.offsetWidth, height = element.offsetHeight;
			return previous.width === width && previous.height === height ? previous : {
				width,
				height
			};
		});
		measure();
		if (typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, [supported, reduced]);
	const map = useMemo(() => {
		const { width: w, height: h } = size;
		if (!w || !h) return void 0;
		const edge = Math.min(w, h) * .07;
		const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>
        <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="${w}" height="${h}" fill="black"/>
      <rect width="${w}" height="${h}" rx="12" fill="url(#red)"/>
      <rect width="${w}" height="${h}" rx="12" fill="url(#blue)" style="mix-blend-mode:difference"/>
      <rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="12" fill="hsl(0 0% 50% / .93)" filter="url(#soft)"/>
    </svg>`;
		return `data:image/svg+xml,${encodeURIComponent(svg)}`;
	}, [size]);
	const refractive = supported && !reduced && !!map;
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: `room-glass-toolbar glass-surface ${refractive ? "glass-surface--svg" : "glass-surface--fallback"}`,
		style: { "--glass-filter": `url(#${id})` },
		children: [refractive && /* @__PURE__ */ jsx("svg", {
			className: "glass-surface__filter",
			"aria-hidden": "true",
			focusable: "false",
			xmlns: "http://www.w3.org/2000/svg",
			children: /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("filter", {
				id,
				colorInterpolationFilters: "sRGB",
				x: "0%",
				y: "0%",
				width: "100%",
				height: "100%",
				children: [
					/* @__PURE__ */ jsx("feImage", {
						href: map,
						x: "0",
						y: "0",
						width: "100%",
						height: "100%",
						preserveAspectRatio: "none",
						result: "map"
					}),
					/* @__PURE__ */ jsx("feDisplacementMap", {
						in: "SourceGraphic",
						in2: "map",
						scale: "-14",
						xChannelSelector: "R",
						yChannelSelector: "B",
						result: "dispRed"
					}),
					/* @__PURE__ */ jsx("feColorMatrix", {
						in: "dispRed",
						type: "matrix",
						values: "1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0",
						result: "red"
					}),
					/* @__PURE__ */ jsx("feDisplacementMap", {
						in: "SourceGraphic",
						in2: "map",
						scale: "-12",
						xChannelSelector: "R",
						yChannelSelector: "B",
						result: "dispGreen"
					}),
					/* @__PURE__ */ jsx("feColorMatrix", {
						in: "dispGreen",
						type: "matrix",
						values: "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0",
						result: "green"
					}),
					/* @__PURE__ */ jsx("feDisplacementMap", {
						in: "SourceGraphic",
						in2: "map",
						scale: "-10",
						xChannelSelector: "R",
						yChannelSelector: "B",
						result: "dispBlue"
					}),
					/* @__PURE__ */ jsx("feColorMatrix", {
						in: "dispBlue",
						type: "matrix",
						values: "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0",
						result: "blue"
					}),
					/* @__PURE__ */ jsx("feBlend", {
						in: "red",
						in2: "green",
						mode: "screen",
						result: "rg"
					}),
					/* @__PURE__ */ jsx("feBlend", {
						in: "rg",
						in2: "blue",
						mode: "screen",
						result: "output"
					}),
					/* @__PURE__ */ jsx("feGaussianBlur", {
						in: "output",
						stdDeviation: "0.4"
					})
				]
			}) })
		}), /* @__PURE__ */ jsx("div", {
			className: "glass-surface__content",
			children
		})]
	});
}
//#endregion
//#region src/components/Comparison.tsx
function Comparison({ before, after, beforeAlt, afterAlt, ratio, withLabel, withoutLabel, split, onSplit, light, onLight, expanded, onExpand, studio = false, sceneLabel, rug }) {
	const { status, revision, retry } = useImagePair(before, after);
	const instructionsId = useId();
	const slider = useRef(null);
	const retryFocus = useRef(null);
	const imagePair = `${before}|${after}`;
	useEffect(() => {
		if (retryFocus.current !== imagePair) retryFocus.current = null;
		if (status === "ready" && retryFocus.current === imagePair) {
			retryFocus.current = null;
			const active = document.activeElement;
			if (active === document.body || active === slider.current?.closest("dialog") || active?.closest(".try-loading")) slider.current?.focus({ preventScroll: true });
		}
	}, [status, imagePair]);
	const expandButton = /* @__PURE__ */ jsx(MotionButton, {
		className: studio ? "expand-button" : "try-expand",
		onClick: onExpand,
		"aria-label": expanded ? "Close expanded room comparison" : "Expand room comparison",
		"aria-expanded": expanded,
		children: expanded ? studio ? "Close expanded view ↙" : "Shrink ↙" : "Expand ↗"
	});
	const floatingControls = !studio && !!onLight;
	const valueText = split === 100 ? withLabel : split === 0 ? withoutLabel : `${split}% ${withLabel.toLowerCase()}, ${100 - split}% ${withoutLabel.toLowerCase()}`;
	return /* @__PURE__ */ jsxs("div", {
		className: studio ? "comparison" : "try-stage",
		id: studio ? expanded ? "expandedComparison" : "comparison" : "tryStage",
		"data-light": light,
		"data-shape": rug ? "rug" : "wide",
		style: {
			"--split": `${split}%`,
			"--try-split": `${split}%`,
			"--try-ratio": ratio
		},
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: studio ? "comparison-image" : "try-frame",
				children: [
					/* @__PURE__ */ jsx(CrossfadeImage, {
						ready: status === "ready",
						revision,
						src: asset(before),
						alt: beforeAlt
					}),
					/* @__PURE__ */ jsx(CrossfadeImage, {
						ready: status === "ready",
						revision,
						className: studio ? "comparison-after" : "try-after",
						src: asset(after),
						alt: afterAlt
					}),
					/* @__PURE__ */ jsx("div", {
						className: studio ? "comparison-line" : "try-divider",
						hidden: split === 0 || split === 100,
						"aria-hidden": "true",
						children: /* @__PURE__ */ jsx("span", { children: "↔" })
					}),
					/* @__PURE__ */ jsx("input", {
						ref: slider,
						type: "range",
						min: "0",
						max: "100",
						step: "1",
						value: split,
						disabled: status !== "ready",
						onChange: (e) => onSplit(Number(e.target.value)),
						"aria-label": studio ? "Reveal the carpet" : `Compare ${withLabel.toLowerCase()} and ${withoutLabel.toLowerCase()}`,
						"aria-describedby": !studio ? instructionsId : void 0,
						"aria-valuetext": valueText
					}),
					/* @__PURE__ */ jsxs("div", {
						className: studio ? "comparison-labels" : "try-image-labels",
						children: [/* @__PURE__ */ jsx("span", {
							hidden: split === 0,
							children: withLabel
						}), /* @__PURE__ */ jsx("span", {
							hidden: split === 100,
							children: withoutLabel
						})]
					}),
					sceneLabel && /* @__PURE__ */ jsx("span", {
						className: "rug-scene-label",
						children: sceneLabel
					}),
					status !== "ready" && /* @__PURE__ */ jsxs("div", {
						className: "try-loading",
						role: "status",
						"aria-live": "polite",
						"aria-atomic": "true",
						children: [/* @__PURE__ */ jsx("span", { children: status === "error" ? "This room preview could not load. Please try again." : "Loading comparison…" }), status === "error" && /* @__PURE__ */ jsx("button", {
							onClick: () => {
								retryFocus.current = imagePair;
								retry();
							},
							children: "Try again"
						})]
					}),
					!floatingControls && expandButton
				]
			}),
			floatingControls && /* @__PURE__ */ jsxs(GlassSurface, { children: [/* @__PURE__ */ jsxs("div", {
				className: "try-lights",
				role: "group",
				"aria-label": "Preview lighting",
				children: [/* @__PURE__ */ jsx(MotionButton, {
					"aria-pressed": light === "day",
					onClick: () => onLight("day"),
					children: "Day"
				}), /* @__PURE__ */ jsx(MotionButton, {
					"aria-pressed": light === "evening",
					onClick: () => onLight("evening"),
					children: "Evening"
				})]
			}), expandButton] }),
			!studio && /* @__PURE__ */ jsxs("div", {
				className: "comparison-adjust",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "comparison-steps",
					role: "group",
					"aria-label": "Adjust comparison",
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": `Show less: ${withLabel}`,
							disabled: status !== "ready" || split === 0,
							onClick: () => onSplit(Math.max(0, split - 10)),
							children: "−"
						}),
						/* @__PURE__ */ jsxs("output", {
							"aria-live": "off",
							children: [
								split,
								"% ",
								withLabel.toLowerCase()
							]
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": `Show more: ${withLabel}`,
							disabled: status !== "ready" || split === 100,
							onClick: () => onSplit(Math.min(100, split + 10)),
							children: "+"
						})
					]
				}), /* @__PURE__ */ jsxs("p", {
					id: instructionsId,
					children: [
						"Drag the divider or use − / +. With the divider focused, use arrow keys to adjust, Home for ",
						withoutLabel.toLowerCase(),
						" and End for ",
						withLabel.toLowerCase(),
						"."
					]
				})]
			})
		]
	});
}
//#endregion
//#region src/hooks/useDialog.ts
var locks = 0;
var previousOverflow = "";
function useDialog() {
	const ref = useRef(null);
	useLayoutEffect(() => {
		const dialog = ref.current;
		const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if (locks++ === 0) {
			previousOverflow = document.body.style.overflow;
			document.body.style.overflow = "hidden";
		}
		dialog.showModal();
		const handleKeyDown = (event) => {
			if (event.key !== "Tab") return;
			const focusable = Array.from(dialog.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"]), summary")).filter((el) => !el.closest("[hidden], [inert]") && getComputedStyle(el).visibility !== "hidden" && el.getClientRects().length > 0);
			if (focusable.length === 0) {
				event.preventDefault();
				return;
			}
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey) {
				if (document.activeElement === first || !dialog.contains(document.activeElement)) {
					event.preventDefault();
					last.focus();
				}
			} else if (document.activeElement === last || !dialog.contains(document.activeElement)) {
				event.preventDefault();
				first.focus();
			}
		};
		dialog.addEventListener("keydown", handleKeyDown);
		return () => {
			dialog.removeEventListener("keydown", handleKeyDown);
			dialog.close();
			if (--locks === 0) document.body.style.overflow = previousOverflow;
			if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
		};
	}, []);
	return ref;
}
function outsideDialog(event) {
	if (event.target !== event.currentTarget) return false;
	const box = event.currentTarget.getBoundingClientRect();
	return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
}
//#endregion
//#region src/components/RoomConfiguration.tsx
function RoomConfiguration({ room }) {
	const { configuration, chooseVariant, saveConfiguration, savedConfiguration, restoreSavedConfiguration } = useApp();
	const plan = getRoomRenderPlan(configuration, room);
	const savedPlan = savedConfiguration ? getRoomRenderPlan(savedConfiguration, room) : null;
	return /* @__PURE__ */ jsxs("details", {
		className: "room-configuration",
		children: [/* @__PURE__ */ jsx("summary", { children: "Keep your room selections" }), /* @__PURE__ */ jsxs("div", {
			className: "configuration-content",
			children: [
				/* @__PURE__ */ jsx("p", { children: "Save the pieces you have selected for each room. This preview offers carpet colours and bare floor with fixed furniture. Additional furniture models are not available yet." }),
				/* @__PURE__ */ jsx("dl", {
					className: "configuration-slots",
					children: roomSlots[room].map((slot) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", { children: slot.label }), /* @__PURE__ */ jsx("dd", { children: slot.variants.length > 1 ? /* @__PURE__ */ jsx("select", {
						"aria-label": `${slot.label} selection for ${room}`,
						value: configuration.rooms[room][slot.id],
						onChange: (event) => chooseVariant(room, slot.id, event.target.value),
						children: slot.variants.map((variant) => /* @__PURE__ */ jsx("option", {
							value: variant.id,
							children: variant.label
						}, variant.id))
					}) : slot.variants[0].label })] }, slot.id))
				}),
				/* @__PURE__ */ jsxs("figure", {
					className: "configuration-preview",
					children: [/* @__PURE__ */ jsx("img", {
						src: asset(plan.image),
						alt: plan.alt,
						loading: "lazy"
					}), /* @__PURE__ */ jsx("figcaption", { children: plan.view === "carpet-study" ? "Carpet study · fixed furniture · a separate view from the homepage room" : "Room study · sample furniture" })]
				}),
				savedPlan && /* @__PURE__ */ jsxs("div", {
					className: "saved-snapshot-section",
					children: [/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "SAVED ROOM SNAPSHOT"
					}), /* @__PURE__ */ jsxs("figure", {
						className: "saved-snapshot-preview",
						children: [/* @__PURE__ */ jsx("img", {
							src: asset(savedPlan.image),
							alt: `Saved snapshot for ${room}`,
							loading: "lazy"
						}), /* @__PURE__ */ jsxs("figcaption", { children: [/* @__PURE__ */ jsx("span", { children: savedPlan.alt }), /* @__PURE__ */ jsx("button", {
							type: "button",
							className: "text-link",
							onClick: restoreSavedConfiguration,
							children: "Restore snapshot ↵"
						})] })]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "configuration-actions",
					children: [/* @__PURE__ */ jsx("button", {
						className: "button outline",
						onClick: saveConfiguration,
						children: "Save room selections"
					}), /* @__PURE__ */ jsx("button", {
						className: "button outline",
						disabled: !savedConfiguration,
						onClick: restoreSavedConfiguration,
						children: "Restore saved selections"
					})]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "fineprint",
					role: "status",
					children: savedConfiguration ? "A saved set of room selections is available in this browser." : "Your current selections stay in this browser. Save a set to restore it later."
				})
			]
		})]
	});
}
//#endregion
//#region src/components/FurnitureTray.tsx
function FurnitureTray({ items, selectedId, onSelect }) {
	const [viewportRef, carousel] = useEmblaCarousel({
		align: "start",
		loop: false
	});
	useEffect(() => {
		if (!carousel) return;
		const index = items.findIndex((item) => item.id === selectedId);
		if (index >= 0) carousel.scrollTo(index, true);
	}, [
		carousel,
		items,
		selectedId
	]);
	return /* @__PURE__ */ jsxs("section", {
		className: "furniture-tray",
		"aria-label": "Furniture options",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "furniture-tray__heading",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", { children: "MAKE IT YOURS" }), /* @__PURE__ */ jsx("h3", { children: "Find your finishing touch." })] }), /* @__PURE__ */ jsx("span", {
				className: "furniture-tray__hint",
				children: "Swipe to explore"
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "furniture-tray__viewport",
			ref: viewportRef,
			children: /* @__PURE__ */ jsx("div", {
				className: "furniture-tray__track",
				children: items.map((item) => /* @__PURE__ */ jsx("div", {
					className: "furniture-tray__slide",
					children: /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "furniture-card",
						"aria-pressed": selectedId === item.id,
						onClick: () => onSelect(item),
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "furniture-card__image",
								children: [/* @__PURE__ */ jsx("img", {
									src: item.image,
									alt: "",
									loading: "lazy",
									draggable: false
								}), selectedId === item.id && /* @__PURE__ */ jsx("span", {
									className: "furniture-card__check",
									"aria-hidden": "true",
									children: "✓"
								})]
							}),
							/* @__PURE__ */ jsx("span", {
								className: "furniture-card__name",
								children: item.name
							}),
							/* @__PURE__ */ jsx("span", {
								className: "furniture-card__finish",
								children: item.finish
							})
						]
					})
				}, item.id))
			})
		})]
	});
}
//#endregion
//#region src/components/TryRoomDialog.tsx
var colours = {
	clay: {
		label: "Clay",
		hex: "#9e4e2c"
	},
	chalk: {
		label: "Chalk",
		hex: "#d4c4a8"
	},
	ink: {
		label: "Ink",
		hex: "#3c3733"
	}
};
function TryRoomDialog({ initial }) {
	const { content, products, configuration, chooseVariant, setTryEntry, openEnquiry, toastMessage } = useApp();
	const dialog = useDialog();
	const [roomId, setRoom] = useState(initial.room);
	const [itemId, setItem] = useState(initial.item);
	const room = content.comparisons[roomId];
	const item = room.items.find((entry) => entry.id === itemId) ?? room.items[0];
	const [split, setSplit] = useState(item.split ?? 50);
	const [light, setLight] = useState("day");
	const [expanded, setExpanded] = useState(false);
	const selectedCarpet = configuration.rooms.living.carpet;
	const colour = selectedCarpet && selectedCarpet in colours ? selectedCarpet : "chalk";
	const product = products[item.colours ? colour : item.product ?? ""];
	const close = () => setTryEntry(null);
	function selectItem(id, roomKey = roomId) {
		const entry = content.comparisons[roomKey].items.find((i) => i.id === id);
		setRoom(roomKey);
		setItem(id);
		setSplit(entry.split ?? 50);
		setLight("day");
	}
	function handleShareRoom() {
		const params = new URLSearchParams();
		params.set("room", roomId);
		params.set("piece", item.id);
		if (item.colours) params.set("rug", colour);
		if (light === "evening") params.set("light", "evening");
		const shareUrl = `${window.location.origin}/?${params.toString()}#home-room`;
		if (navigator.clipboard?.writeText) navigator.clipboard.writeText(shareUrl).then(() => {
			toast.success("Room link copied to clipboard", { description: `${room.label} with ${item.label} (${light} light).` });
		}).catch(() => {
			toast.info(`Room link: ${shareUrl}`);
		});
		else toast.info(`Room link: ${shareUrl}`);
	}
	return /* @__PURE__ */ jsxs("dialog", {
		ref: dialog,
		"data-lenis-prevent": true,
		className: `try-room-dialog${expanded ? " try-room-expanded" : ""}`,
		id: "tryRoom",
		"aria-labelledby": "tryRoomTitle",
		"aria-modal": "true",
		onCancel: (event) => {
			event.preventDefault();
			if (expanded) setExpanded(false);
			else close();
		},
		onClick: (event) => {
			if (outsideDialog(event)) close();
		},
		children: [/* @__PURE__ */ jsxs("header", {
			className: "try-room-head",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: "TRY THE ROOM"
			}), /* @__PURE__ */ jsx("h2", {
				id: "tryRoomTitle",
				children: "See what a piece changes."
			})] }), /* @__PURE__ */ jsx("button", {
				className: "icon-button",
				onClick: close,
				"aria-label": "Close Try the room",
				autoFocus: true,
				children: "×"
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "try-room-body",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "try-guidance",
					children: "Choose a room and a piece, then compare the two views."
				}),
				/* @__PURE__ */ jsx("nav", {
					className: "try-room-tabs",
					"aria-label": "Choose a room to try",
					children: Object.keys(content.comparisons).map((id) => /* @__PURE__ */ jsx("button", {
						"aria-pressed": id === roomId,
						onClick: () => selectItem(content.comparisons[id].items[0].id, id),
						children: content.comparisons[id].label
					}, id))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "try-workspace",
					children: [/* @__PURE__ */ jsxs("aside", {
						className: "try-sidebar",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "eyebrow",
								children: "CHOOSE WHAT TO TRY"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "try-items",
								role: "group",
								"aria-label": "Choose a piece",
								children: room.items.map((entry) => /* @__PURE__ */ jsxs("button", {
									"aria-pressed": entry.id === item.id,
									onClick: () => selectItem(entry.id),
									children: [/* @__PURE__ */ jsx("span", { children: entry.label }), /* @__PURE__ */ jsx("span", {
										"aria-hidden": "true",
										children: "↗"
									})]
								}, entry.id))
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "try-selection",
								"aria-live": "polite",
								"aria-atomic": "true",
								children: [
									/* @__PURE__ */ jsx("h3", { children: product?.name ?? "Kitchen design" }),
									/* @__PURE__ */ jsx("p", { children: product?.text ?? "Compare the room before the kitchen installation with the finished design concept." }),
									product && /* @__PURE__ */ jsxs("div", {
										className: "try-specs",
										children: [/* @__PURE__ */ jsxs("span", { children: [
											/* @__PURE__ */ jsx("strong", { children: "Palette:" }),
											" ",
											product.palette
										] }), /* @__PURE__ */ jsxs("span", { children: [
											/* @__PURE__ */ jsx("strong", { children: "Collection:" }),
											" ",
											product.type
										] })]
									})
								]
							}),
							item.colours && /* @__PURE__ */ jsx("div", {
								className: "try-colours",
								role: "group",
								"aria-label": "Carpet colour",
								children: Object.keys(colours).map((id) => /* @__PURE__ */ jsxs("button", {
									"aria-pressed": colour === id,
									onClick: () => chooseVariant("living", "carpet", id),
									children: [/* @__PURE__ */ jsx("i", {
										"aria-hidden": "true",
										style: { "--colour": colours[id].hex }
									}), colours[id].label]
								}, id))
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "try-preview",
						children: [
							/* @__PURE__ */ jsx(Comparison, {
								before: item.before,
								after: item.colours ? `room-${colour}.webp` : item.after,
								beforeAlt: `${room.label} · ${item.withoutLabel.toLowerCase()}`,
								afterAlt: `${room.label} · ${item.withLabel.toLowerCase()}${item.colours ? ` in ${colour}` : ""}`,
								ratio: item.ratio,
								withLabel: item.withLabel,
								withoutLabel: item.withoutLabel,
								split,
								onSplit: setSplit,
								light,
								onLight: setLight,
								expanded,
								onExpand: () => setExpanded(!expanded),
								rug: item.colours
							}),
							/* @__PURE__ */ jsx("div", {
								className: "try-toolbar",
								children: /* @__PURE__ */ jsxs("div", {
									className: "try-views",
									role: "group",
									"aria-label": "Comparison view",
									children: [
										/* @__PURE__ */ jsx(MotionButton, {
											"aria-pressed": split === 100,
											onClick: () => setSplit(100),
											children: item.id === "kitchen" ? "With design" : "With piece"
										}),
										/* @__PURE__ */ jsx(MotionButton, {
											"aria-pressed": split > 0 && split < 100,
											onClick: () => setSplit(item.split ?? 50),
											children: "Compare"
										}),
										/* @__PURE__ */ jsx(MotionButton, {
											"aria-pressed": split === 0,
											onClick: () => setSplit(0),
											children: item.id === "kitchen" ? "Before design" : "Without piece"
										})
									]
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "try-actions",
								children: [
									product && /* @__PURE__ */ jsx(SaveButton, {
										id: product.id,
										className: "text-link"
									}),
									/* @__PURE__ */ jsxs(MotionButton, {
										className: "button",
										onClick: () => openEnquiry(product?.name ?? item.interest ?? "Kitchen design"),
										children: [
											product ? "Enquire about this piece" : "Discuss your kitchen",
											" ",
											/* @__PURE__ */ jsx(Icon, {})
										]
									}),
									/* @__PURE__ */ jsx("button", {
										type: "button",
										className: "text-link share-room-link-btn",
										onClick: handleShareRoom,
										children: "Share room link ↗"
									})
								]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "try-feedback",
								role: "status",
								"aria-live": "polite",
								"aria-atomic": "true",
								children: toastMessage
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "try-help",
								children: [/* @__PURE__ */ jsx("p", { children: "Drag the divider to compare with and without the selected piece. Illustrative room studies; lighting is a visual filter." }), /* @__PURE__ */ jsx("button", {
									onClick: () => {
										setSplit(item.split ?? 50);
										setLight("day");
									},
									children: "Reset view"
								})]
							}),
							/* @__PURE__ */ jsx(RoomConfiguration, { room: roomId }),
							/* @__PURE__ */ jsx(FurnitureTray, {
								items: room.items.map((entry) => {
									const p = entry.colours ? products[colour] : entry.product ? products[entry.product] : void 0;
									return {
										id: entry.id,
										name: entry.label,
										finish: p?.palette ?? "Illustrative design study",
										image: asset(p?.image ?? entry.after)
									};
								}),
								selectedId: item.id,
								onSelect: (option) => selectItem(option.id)
							})
						]
					})]
				})
			]
		})]
	});
}
//#endregion
//#region src/pages/CarpetStudio.tsx
function ExpandedComparison({ onClose, ...props }) {
	const dialog = useDialog();
	return /* @__PURE__ */ jsxs("dialog", {
		ref: dialog,
		"data-lenis-prevent": true,
		className: "studio-expanded",
		"aria-label": "Expanded carpet comparison",
		onCancel: (event) => {
			event.preventDefault();
			onClose();
		},
		children: [/* @__PURE__ */ jsxs("div", {
			className: "studio-expanded-bar",
			children: [/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: "CARPET STUDIO · EXPANDED VIEW"
			}), /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "button outline studio-expanded-close",
				onClick: onClose,
				"aria-label": "Close expanded view",
				children: "Close view (Esc) ✕"
			})]
		}), /* @__PURE__ */ jsx(Comparison, { ...props })]
	});
}
function CarpetStudio() {
	const { products, query, openEnquiry, chooseVariant } = useApp();
	const location = useLocation();
	const requested = new URLSearchParams(location.search).get("rug");
	const colour = requested && Object.hasOwn(colours, requested) ? requested : "clay";
	const [split, setSplit] = useState(65);
	const [light, setLight] = useState("day");
	const [expanded, setExpanded] = useState(false);
	const product = products[colour];
	useEffect(() => {
		[
			"room-clay.webp",
			"room-chalk.webp",
			"room-ink.webp",
			"room-empty.webp"
		].forEach((src) => {
			const img = new Image();
			img.src = asset(src);
		});
	}, []);
	useEffect(() => {
		if (requested && Object.hasOwn(colours, requested)) chooseVariant("living", "carpet", requested);
	}, [requested]);
	function select(id) {
		chooseVariant("living", "carpet", id);
		query({ rug: id });
	}
	const comparison = {
		studio: true,
		before: "room-empty.webp",
		after: `room-${colour}.webp`,
		beforeAlt: "Living room with a bare oak floor",
		afterAlt: `Living room with ${product.name}`,
		ratio: 1.5,
		withLabel: "With carpet",
		withoutLabel: "Bare floor",
		split,
		onSplit: setSplit,
		light,
		expanded: false,
		onExpand: () => setExpanded(true),
		sceneLabel: product.name.toUpperCase()
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("section", {
			className: "rug-studio section",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "studio-heading",
					children: [/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx(SiteLink, {
							className: "back-link",
							to: "/?room=living#home-room",
							children: "← Back to the home"
						}),
						/* @__PURE__ */ jsx("span", {
							className: "eyebrow",
							children: "THE CARPET STUDIO"
						}),
						/* @__PURE__ */ jsxs("h1", { children: [
							"One room.",
							/* @__PURE__ */ jsx("br", {}),
							/* @__PURE__ */ jsx("em", { children: "A different feeling." })
						] })
					] }), /* @__PURE__ */ jsxs("p", { children: [
						"Choose a colour, then move the divider.",
						/* @__PURE__ */ jsx("br", {}),
						"See what a carpet brings to the room."
					] })]
				}),
				/* @__PURE__ */ jsx(Comparison, { ...comparison }),
				/* @__PURE__ */ jsxs("div", {
					className: "rug-controls",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "rug-colours",
							"aria-label": "Carpet colour",
							children: Object.keys(colours).map((id) => /* @__PURE__ */ jsxs("button", {
								"aria-pressed": colour === id,
								onClick: () => select(id),
								children: [/* @__PURE__ */ jsx("i", { style: { "--swatch": colours[id].hex } }), colours[id].label]
							}, id))
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "rug-light",
							children: [
								/* @__PURE__ */ jsx("button", {
									"aria-pressed": light === "day",
									onClick: () => setLight("day"),
									children: "Day"
								}),
								/* @__PURE__ */ jsx("button", {
									"aria-pressed": light === "evening",
									onClick: () => setLight("evening"),
									children: "Evening"
								}),
								/* @__PURE__ */ jsx("button", {
									onClick: () => {
										select("clay");
										setSplit(65);
										setLight("day");
									},
									children: "Reset"
								})
							]
						}),
						/* @__PURE__ */ jsxs(MotionButton, {
							className: "button",
							onClick: () => openEnquiry(product.name),
							children: [
								"Enquire about ",
								colours[colour].label,
								" ",
								/* @__PURE__ */ jsx(Icon, {})
							]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "studio-foot",
					children: [/* @__PURE__ */ jsx("span", { children: "Illustrative room. Lighting is a visual filter." }), /* @__PURE__ */ jsx(SaveButton, {
						className: "text-link",
						id: colour,
						children: "Save this carpet"
					})]
				})
			]
		}),
		/* @__PURE__ */ jsxs(RevealSection, {
			className: "studio-collection section",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "section-heading",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "THE FRAME STUDY"
				}), /* @__PURE__ */ jsx("h2", { children: "Find your colour." })] }), /* @__PURE__ */ jsxs(SiteLink, {
					className: "text-link",
					to: "/#collection",
					children: ["Explore the whole collection ", /* @__PURE__ */ jsx(Icon, {})]
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "product-grid",
				children: [
					"clay",
					"chalk",
					"ink"
				].map((id) => /* @__PURE__ */ jsx(ProductCard, { product: products[id] }, id))
			})]
		}),
		expanded && /* @__PURE__ */ jsx(ExpandedComparison, {
			...comparison,
			expanded: true,
			onExpand: () => setExpanded(false),
			onClose: () => setExpanded(false)
		})
	] });
}
//#endregion
//#region src/pages/ProductPage.tsx
function RoomFitChecker({ dimensions }) {
	const [roomW, setRoomW] = useState("4.5");
	const [roomL, setRoomL] = useState("5.0");
	if (!dimensions) return null;
	const pieceW = parseFloat(dimensions.width) / (dimensions.width.includes("cm") ? 100 : 1);
	const pieceD = parseFloat(dimensions.depth) / (dimensions.depth.includes("cm") ? 100 : 1);
	const rw = parseFloat(roomW) || 4.5;
	const rl = parseFloat(roomL) || 5;
	const roomArea = rw * rl;
	const pieceArea = pieceW * pieceD;
	const footprintPct = Math.min(100, Math.round(pieceArea / roomArea * 100));
	const clearance = Math.max(0, (Math.min(rw, rl) - Math.max(pieceW, pieceD)) / 2).toFixed(1);
	const fitVerdict = parseFloat(clearance) >= .8 ? {
		label: "Generous fit",
		cls: "fit-great",
		desc: "Optimal circulation with > 80 cm side clearance."
	} : parseFloat(clearance) >= .5 ? {
		label: "Balanced fit",
		cls: "fit-good",
		desc: "Comfortable proportions for standard spaces."
	} : {
		label: "Snug fit",
		cls: "fit-snug",
		desc: "Cozy scale; consider orientation against walls."
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "room-fit-widget",
		"aria-label": "Room fit calculator",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "room-fit-header",
				children: [/* @__PURE__ */ jsx("h4", { children: "Check Room Scale & Fit" }), /* @__PURE__ */ jsxs("span", {
					className: `fit-pill ${fitVerdict.cls}`,
					children: ["● ", fitVerdict.label]
				})]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "room-fit-sub",
				children: "Estimate how this piece will sit in your specific room:"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "room-fit-inputs",
				children: [/* @__PURE__ */ jsxs("label", { children: [/* @__PURE__ */ jsx("span", { children: "Width (m)" }), /* @__PURE__ */ jsx("input", {
					type: "number",
					min: "1.5",
					max: "15",
					step: "0.5",
					value: roomW,
					onChange: (e) => setRoomW(e.target.value)
				})] }), /* @__PURE__ */ jsxs("label", { children: [/* @__PURE__ */ jsx("span", { children: "Length (m)" }), /* @__PURE__ */ jsx("input", {
					type: "number",
					min: "1.5",
					max: "15",
					step: "0.5",
					value: roomL,
					onChange: (e) => setRoomL(e.target.value)
				})] })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "room-fit-readout",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("span", { children: "Room area:" }),
						" ",
						/* @__PURE__ */ jsxs("strong", { children: [(rw * rl).toFixed(1), " m²"] })
					] }),
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("span", { children: "Footprint:" }),
						" ",
						/* @__PURE__ */ jsxs("strong", { children: [
							"~",
							footprintPct,
							"% of floor"
						] })
					] }),
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("span", { children: "Clearance:" }),
						" ",
						/* @__PURE__ */ jsxs("strong", { children: [
							"~",
							clearance,
							" m"
						] })
					] })
				]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "room-fit-verdict",
				children: fitVerdict.desc
			})
		]
	});
}
function BespokeProjectEstimator({ product, onEnquire }) {
	const [tier, setTier] = useState("room");
	const [woodFinish, setWoodFinish] = useState("standard");
	const current = {
		piece: {
			title: "Statement Piece",
			price: woodFinish === "standard" ? "रू 3,80,000 - रू 5,20,000" : "रू 4,60,000 - रू 6,40,000",
			timeline: "4-6 weeks handcrafted",
			scopeDesc: `Handcrafted ${product.name} in ${product.palette}. Sized for your primary space.`,
			deliverables: [
				"Dedicated artisan workshop build and bench-made assembly in Patan",
				"Pre-scheduled Kathmandu Valley room placement and unboxing",
				"5-year structural joinery and frame warranty"
			]
		},
		room: {
			title: "Complete Room Curation",
			price: woodFinish === "standard" ? "रू 16,50,000 - रू 24,00,000" : "रू 19,50,000 - रू 29,00,000",
			timeline: "6-8 weeks artisan curation",
			scopeDesc: `${product.name} + 2 coordinating accent pieces and a hand-knotted Tibetan wool carpet.`,
			deliverables: [
				"Complimentary spatial scale and lighting audit",
				"Curated acoustic palette coordination with textile swatch kit",
				"Consolidated room placement and unboxing in Kathmandu Valley",
				"Priority workshop bench reservation with lead craftsman"
			]
		},
		residence: {
			title: "Architectural Residence Suite",
			price: woodFinish === "standard" ? "रू 58,00,000 - रू 1,10,00,000+" : "रू 72,00,000 - रू 1,35,00,000+",
			timeline: "10-14 weeks atelier production",
			scopeDesc: "Whole-home interior package covering living, dining, private suites, and custom architectural kitchen.",
			deliverables: [
				"Dedicated Senior Atelier Interior Architect & project manager",
				"Custom millimeter dimension tailoring & COM (Customer’s Own Material)",
				"Full 3D digital architectural visualization & finish board delivery",
				"Milestone-based workshop video updates and private studio viewing"
			]
		}
	}[tier];
	function handleEnquire() {
		const briefNotes = `Project estimate requested for ${product.name}:\n- Scope: ${current.title} (${current.price})\n- Finish spec: ${woodFinish === "standard" ? "Artisan Standard (" + product.palette + ")" : "Custom Millimeter Bespoke / COM"}\n- Estimated timeline: ${current.timeline}\n- Deliverables: ${current.deliverables.join("; ")}`;
		onEnquire(current.title, briefNotes);
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "project-estimator-section",
		"aria-label": "Bespoke project budget and scope estimator",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "estimator-header",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "TRANSPARENT ATELIER INVESTMENT"
				}), /* @__PURE__ */ jsx("h3", { children: "Project Budget & Scope Estimator" })] }), /* @__PURE__ */ jsx("span", {
					className: "estimator-badge",
					children: "● Artisan Direct Pricing"
				})]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "estimator-sub",
				children: "Explore estimated investment ranges from single statement commissions to complete whole-home architectural curations:"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "estimator-tier-tabs",
				role: "tablist",
				"aria-label": "Project scope tier",
				children: [
					/* @__PURE__ */ jsx("button", {
						type: "button",
						role: "tab",
						"aria-selected": tier === "piece",
						className: `estimator-tab${tier === "piece" ? " active" : ""}`,
						onClick: () => setTier("piece"),
						children: "Statement Piece"
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						role: "tab",
						"aria-selected": tier === "room",
						className: `estimator-tab${tier === "room" ? " active" : ""}`,
						onClick: () => setTier("room"),
						children: ["Room Curation ", /* @__PURE__ */ jsx("span", {
							className: "tab-pill",
							children: "Most Requested"
						})]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						role: "tab",
						"aria-selected": tier === "residence",
						className: `estimator-tab${tier === "residence" ? " active" : ""}`,
						onClick: () => setTier("residence"),
						children: "Full Residence Suite"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "estimator-card",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "estimator-main-row",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h4", {
							className: "estimator-tier-name",
							children: current.title
						}), /* @__PURE__ */ jsx("p", {
							className: "estimator-tier-desc",
							children: current.scopeDesc
						})] }), /* @__PURE__ */ jsxs("div", {
							className: "estimator-price-box",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "estimator-price-label",
									children: "Estimated Investment"
								}),
								/* @__PURE__ */ jsx("strong", {
									className: "estimator-price",
									children: current.price
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "estimator-timeline",
									children: ["⏱ ", current.timeline]
								})
							]
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "estimator-options-row",
						children: /* @__PURE__ */ jsxs("label", { children: [/* @__PURE__ */ jsx("span", { children: "Finish specification:" }), /* @__PURE__ */ jsxs("select", {
							value: woodFinish,
							onChange: (e) => setWoodFinish(e.target.value),
							children: [/* @__PURE__ */ jsxs("option", {
								value: "standard",
								children: [
									"Signature Palette (",
									product.palette,
									")"
								]
							}), /* @__PURE__ */ jsx("option", {
								value: "custom",
								children: "Bespoke Millimeter Tailoring / COM Upholstery (+15%)"
							})]
						})] })
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "estimator-deliverables",
						children: [/* @__PURE__ */ jsx("span", {
							className: "deliverables-title",
							children: "Included Atelier Services:"
						}), /* @__PURE__ */ jsx("ul", { children: current.deliverables.map((item, i) => /* @__PURE__ */ jsx("li", { children: item }, i)) })]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "estimator-actions",
						children: [/* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "button",
							onClick: handleEnquire,
							children: ["Apply scope to project enquiry ", /* @__PURE__ */ jsx(Icon, {})]
						}), /* @__PURE__ */ jsx("span", {
							className: "estimator-note",
							children: "No obligation. Pricing confirmed after initial space consultation."
						})]
					})
				]
			})
		]
	});
}
function TradeConciergeCard({ onTrade, onSwatch }) {
	return /* @__PURE__ */ jsx("div", {
		className: "trade-concierge-portal",
		"aria-label": "Trade and architect services",
		children: /* @__PURE__ */ jsxs("div", {
			className: "trade-portal-content",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "TRADE & ARCHITECTURAL SPECIFICATION"
				}),
				/* @__PURE__ */ jsx("h3", { children: "For Interior Designers, Architects & Developers" }),
				/* @__PURE__ */ jsx("p", { children: "We partner with leading design studios and architectural practices globally. Access trade privileges, technical 2D/3D CAD models, and prioritized workshop scheduling for your residential and commercial projects." }),
				/* @__PURE__ */ jsxs("div", {
					className: "trade-highlights-grid",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "trade-highlight-item",
							children: [/* @__PURE__ */ jsx("strong", { children: "Direct Trade Collaboration" }), /* @__PURE__ */ jsx("span", { children: "Tiered commercial volume pricing on qualified studio projects." })]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "trade-highlight-item",
							children: [/* @__PURE__ */ jsx("strong", { children: "2D & 3D CAD Library" }), /* @__PURE__ */ jsx("span", { children: "Direct .DWG, .OBJ, and high-resolution material PBR render textures." })]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "trade-highlight-item",
							children: [/* @__PURE__ */ jsx("strong", { children: "Dedicated Account Lead" }), /* @__PURE__ */ jsx("span", { children: "Single point of contact with 24-hour turnaround on formal quotations." })]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "trade-highlight-item",
							children: [/* @__PURE__ */ jsx("strong", { children: "Custom Millimeter Specs" }), /* @__PURE__ */ jsx("span", { children: "Bespoke sizing, COM upholstery, and contract fire-rated certifications." })]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "trade-portal-actions",
					children: [/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "button",
						onClick: onTrade,
						children: ["Request trade account & CAD files ", /* @__PURE__ */ jsx(Icon, {})]
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "button outline",
						onClick: onSwatch,
						children: "Order complimentary material swatch box ↗"
					})]
				})
			]
		})
	});
}
function AtelierProvenance() {
	return /* @__PURE__ */ jsxs("div", {
		className: "atelier-provenance-section",
		"aria-label": "Atelier craftsmanship pillars",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "section-head-mini",
			children: [/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: "CRAFT & PROVENANCE"
			}), /* @__PURE__ */ jsx("h4", { children: "The Kathmandu Atelier Standard" })]
		}), /* @__PURE__ */ jsx("div", {
			className: "provenance-grid",
			children: [
				{
					num: "01",
					title: "Patan Master Joinery",
					desc: "Solid kiln-dried hardwoods connected with traditional mortise-and-tenon wood dowels by generational woodcarvers in the Kathmandu Valley."
				},
				{
					num: "02",
					title: "100-Knot Highland Wool",
					desc: "Hand-carded Tibetan highland wool washed in glacial spring waters and knotted by hand with zero chemical binding agents or synthetic backings."
				},
				{
					num: "03",
					title: "Living Organic Patina",
					desc: "Hand-buffed with pure cold-pressed walnut oil and Himalayan beeswax. An organic finish that breathes and acquires a rich natural patina over decades."
				},
				{
					num: "04",
					title: "Dedicated Room Placement",
					desc: "Turnkey installation crew delivers into your room of choice, levels the piece, secures structural anchor points, and recycles all packaging."
				}
			].map((pill) => /* @__PURE__ */ jsxs("div", {
				className: "provenance-card",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "card-number",
						children: pill.num
					}),
					/* @__PURE__ */ jsx("h5", { children: pill.title }),
					/* @__PURE__ */ jsx("p", { children: pill.desc })
				]
			}, pill.num))
		})]
	});
}
function ArchitecturalSpatialNotes() {
	return /* @__PURE__ */ jsxs("div", {
		className: "atelier-spatial-notes-section",
		"aria-label": "Architectural spatial guidance",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "section-head-mini",
			children: [/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: "ARCHITECTURAL GUIDANCE"
			}), /* @__PURE__ */ jsx("h4", { children: "Spatial Principles & Placement" })]
		}), /* @__PURE__ */ jsx("div", {
			className: "spatial-notes-grid",
			children: [{
				title: "Circulation & Walkways",
				rule: "Maintain 90 cm clearance around primary seating perimeters for unhurried spatial flow.",
				tip: "In open-plan residences, use the carpet boundary to anchor the conversational zone without erecting visual barriers."
			}, {
				title: "Daylight & Material Patina",
				rule: "Orient native Sisau and American Walnut where natural morning or indirect northern daylight reveals the wood grain.",
				tip: "Organic botanical oil finishes adapt gracefully to Himalayan relative humidity transitions."
			}].map((n, idx) => /* @__PURE__ */ jsxs("div", {
				className: "spatial-note-card",
				children: [
					/* @__PURE__ */ jsx("h5", { children: n.title }),
					/* @__PURE__ */ jsxs("p", {
						className: "spatial-rule",
						children: [
							/* @__PURE__ */ jsx("strong", { children: "Guideline:" }),
							" ",
							n.rule
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "spatial-tip",
						children: n.tip
					})
				]
			}, idx))
		})]
	});
}
function KathmanduShowroomCard({ onBookVisit }) {
	return /* @__PURE__ */ jsx("div", {
		className: "showroom-visit-card",
		"aria-label": "Visit our Kathmandu galleries",
		children: /* @__PURE__ */ jsxs("div", {
			className: "showroom-card-body",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "EXPERIENCE IN PERSON"
				}),
				/* @__PURE__ */ jsx("h4", { children: "Visit Our Galleries in Kathmandu" }),
				/* @__PURE__ */ jsx("p", { children: "We welcome private clients, interior designers, and architects to experience the tactile warmth of our collection in natural daylight." }),
				/* @__PURE__ */ jsxs("div", {
					className: "showroom-locations-grid",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "location-box",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "location-badge",
								children: "Gallery & Showroom"
							}),
							/* @__PURE__ */ jsx("h5", { children: "Baber Mahal Revisited" }),
							/* @__PURE__ */ jsx("p", { children: "Courtyard II, Kathmandu, Nepal" }),
							/* @__PURE__ */ jsx("small", { children: "Monday – Saturday · 10:00 to 18:00" })
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "location-box",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "location-badge",
								children: "Atelier & Workshop"
							}),
							/* @__PURE__ */ jsx("h5", { children: "Patan Craft Quarter" }),
							/* @__PURE__ */ jsx("p", { children: "Industrial Estate, Lalitpur, Nepal" }),
							/* @__PURE__ */ jsx("small", { children: "By Private Appointment with Master Craftsman" })
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "showroom-card-actions",
					children: [/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "button",
						onClick: onBookVisit,
						children: ["Book a private gallery viewing ", /* @__PURE__ */ jsx(Icon, {})]
					}), /* @__PURE__ */ jsx("a", {
						href: "https://wa.me/9779801234567",
						target: "_blank",
						rel: "noopener noreferrer",
						className: "button outline",
						children: "Direct WhatsApp Concierge ↗"
					})]
				})
			]
		})
	});
}
function ProductPage() {
	const { id } = useParams();
	const { products, content, openProduct, openEnquiry, openTry } = useApp();
	const [galleryIndex, setGalleryIndex] = useState(0);
	const p = id ? products[id] : void 0;
	useEffect(() => {
		window.scrollTo({
			top: 0,
			behavior: "instant"
		});
		setGalleryIndex(0);
	}, [id]);
	if (!p) return /* @__PURE__ */ jsxs("section", {
		className: "section product-not-found",
		children: [
			/* @__PURE__ */ jsx("h1", { children: "Piece not found" }),
			/* @__PURE__ */ jsx("p", { children: "This design concept is not in our current collection." }),
			/* @__PURE__ */ jsxs(SiteLink, {
				className: "button",
				to: "/#collection",
				children: ["Explore the collection ", /* @__PURE__ */ jsx(Icon, {})]
			})
		]
	});
	const roomImage = p.category === "carpets" ? `room-${p.id}.webp` : content.rooms[p.scene]?.image ?? p.image;
	const gallery = p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages : [{
		src: p.image,
		label: "Studio portrait",
		alt: `${p.name} studio portrait`
	}, {
		src: roomImage,
		label: "Room context",
		alt: `${p.name} in room context`
	}];
	const activeImage = gallery[galleryIndex] ?? gallery[0];
	const related = (p.relatedIds ?? []).map((relId) => products[relId]).filter(Boolean);
	function handleShareProduct() {
		if (!p) return;
		const url = window.location.href;
		if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(() => {
			toast.success("Piece link copied", { description: `${p.name} link copied to clipboard.` });
		}).catch(() => {
			toast.info(`Link: ${url}`);
		});
		else toast.info(`Link: ${url}`);
	}
	return /* @__PURE__ */ jsxs("article", {
		className: "product-page section",
		children: [
			/* @__PURE__ */ jsxs("nav", {
				className: "product-breadcrumb",
				"aria-label": "Breadcrumb",
				children: [
					/* @__PURE__ */ jsx(SiteLink, {
						to: "/",
						children: "Home"
					}),
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						children: "/"
					}),
					/* @__PURE__ */ jsx(SiteLink, {
						to: "/#collection",
						children: "Collection"
					}),
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						children: "/"
					}),
					/* @__PURE__ */ jsx(SiteLink, {
						to: `/?room=${p.scene}#home-room`,
						children: p.scene.toUpperCase()
					}),
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						children: "/"
					}),
					/* @__PURE__ */ jsx("span", {
						"aria-current": "page",
						children: p.name
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "product-hero-layout",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "product-gallery-stage",
					children: [/* @__PURE__ */ jsx("div", {
						className: "product-main-view",
						children: /* @__PURE__ */ jsx(AnimatePresence, {
							mode: "wait",
							children: /* @__PURE__ */ jsx(m.img, {
								src: asset(activeImage.src),
								alt: activeImage.alt,
								style: galleryIndex === 0 ? focusStyle(p) : void 0,
								initial: false,
								animate: { opacity: 1 },
								exit: { opacity: .88 },
								transition: { duration: .22 }
							}, activeImage.src)
						})
					}), /* @__PURE__ */ jsx("div", {
						className: "product-gallery-thumbnails",
						role: "group",
						"aria-label": "Product photography angles",
						children: gallery.map((img, i) => /* @__PURE__ */ jsxs("button", {
							type: "button",
							className: `gallery-thumb-btn${galleryIndex === i ? " active" : ""}`,
							"aria-pressed": galleryIndex === i,
							onClick: () => setGalleryIndex(i),
							"aria-label": img.label,
							children: [/* @__PURE__ */ jsx("img", {
								src: asset(img.src),
								alt: ""
							}), /* @__PURE__ */ jsx("span", { children: img.label })]
						}, img.src + i))
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "product-primary-info",
					children: [
						/* @__PURE__ */ jsxs("span", {
							className: "eyebrow",
							children: [p.type.toUpperCase(), " · CHANDANI ATELIER"]
						}),
						/* @__PURE__ */ jsx("h1", { children: p.name }),
						/* @__PURE__ */ jsx("p", {
							className: "product-lead",
							children: p.text
						}),
						p.availability && /* @__PURE__ */ jsxs("div", {
							className: "product-page-status",
							children: [/* @__PURE__ */ jsx("span", {
								className: "avail-dot",
								children: "●"
							}), /* @__PURE__ */ jsx("span", { children: p.availability })]
						}),
						p.dimensions && /* @__PURE__ */ jsxs("div", {
							className: "product-quick-specs",
							"aria-label": "Key dimensions",
							children: [
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Width" }), /* @__PURE__ */ jsx("strong", { children: p.dimensions.width })] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Depth" }), /* @__PURE__ */ jsx("strong", { children: p.dimensions.depth })] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Height" }), /* @__PURE__ */ jsx("strong", { children: p.dimensions.height })] }),
								p.dimensions.seatHeight && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Seat" }), /* @__PURE__ */ jsx("strong", { children: p.dimensions.seatHeight })] }),
								p.dimensions.weight && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Weight" }), /* @__PURE__ */ jsx("strong", { children: p.dimensions.weight })] })
							]
						}),
						/* @__PURE__ */ jsxs("dl", {
							className: "detail-specs",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", { children: "PALETTE" }), /* @__PURE__ */ jsx("dd", { children: p.palette })] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", { children: "COLLECTION" }), /* @__PURE__ */ jsx("dd", { children: p.type })] })]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "product-main-actions",
							children: [
								/* @__PURE__ */ jsxs(MotionButton, {
									className: "button",
									onClick: () => openEnquiry(p.name),
									children: ["Enquire about this piece ", /* @__PURE__ */ jsx(Icon, {})]
								}),
								/* @__PURE__ */ jsx(SaveButton, {
									id: p.id,
									className: "button outline"
								}),
								/* @__PURE__ */ jsxs(MotionButton, {
									className: "button outline",
									onClick: () => openTry(p.id),
									"aria-haspopup": "dialog",
									children: ["Try in the room ", /* @__PURE__ */ jsx(Icon, {})]
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									className: "button outline",
									onClick: handleShareProduct,
									children: "Share piece ↗"
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "product-quick-perks",
							role: "group",
							"aria-label": "Bespoke atelier services",
							children: [/* @__PURE__ */ jsx("button", {
								type: "button",
								className: "quick-perk-btn",
								onClick: () => openEnquiry(p.name, "swatch"),
								children: "Material & Finish Samples"
							}), /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "quick-perk-btn",
								onClick: () => openEnquiry(p.name, "trade"),
								children: "Architecture & Designer Collaboration"
							})]
						}),
						p.category === "carpets" ? /* @__PURE__ */ jsxs(SiteLink, {
							className: "text-link",
							to: `/carpet-studio?rug=${p.id}`,
							children: ["Compare it in the carpet studio ", /* @__PURE__ */ jsx(Icon, {})]
						}) : /* @__PURE__ */ jsxs(SiteLink, {
							className: "text-link",
							to: `/?room=${p.scene}&piece=${p.id}#home-room`,
							children: ["Explore room inspiration ", /* @__PURE__ */ jsx(Icon, {})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "product-guarantee-note",
							children: /* @__PURE__ */ jsxs("p", { children: [/* @__PURE__ */ jsx("strong", { children: "Bespoke Craftsmanship:" }), " Each Chandani piece is custom made or finished in small artisan workshops. Pricing, dimensions, and finishes are confirmed prior to production."] })
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs(RevealSection, {
				className: "product-deep-dive section",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "section-heading",
						children: /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "eyebrow",
							children: "SPECIFICATIONS & CRAFT"
						}), /* @__PURE__ */ jsx("h2", { children: "Made for your home." })] })
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "product-specs-grid",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "product-spec-card",
							children: [
								/* @__PURE__ */ jsx("h3", { children: "Materials & Finish" }),
								/* @__PURE__ */ jsxs("p", { children: [
									/* @__PURE__ */ jsx("strong", { children: "Palette:" }),
									" ",
									p.finishDetails ?? p.palette
								] }),
								p.materialsList && /* @__PURE__ */ jsx("ul", { children: p.materialsList.map((m, i) => /* @__PURE__ */ jsx("li", { children: m }, i)) })
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "product-spec-card",
							children: [/* @__PURE__ */ jsx("h3", { children: "Dimensions & Scale" }), p.dimensions ? /* @__PURE__ */ jsx("table", { children: /* @__PURE__ */ jsxs("tbody", { children: [
								/* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Width" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.width })] }),
								/* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Depth" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.depth })] }),
								/* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Height" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.height })] }),
								p.dimensions.seatHeight && /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Seat Height" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.seatHeight })] }),
								p.dimensions.clearance && /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Clearance" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.clearance })] }),
								p.dimensions.weight && /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", { children: "Weight" }), /* @__PURE__ */ jsx("td", { children: p.dimensions.weight })] })
							] }) }) : /* @__PURE__ */ jsx("p", { children: "Custom dimensions available on request." })]
						})]
					}),
					/* @__PURE__ */ jsx(RoomFitChecker, { dimensions: p.dimensions }),
					/* @__PURE__ */ jsx("div", {
						className: "product-accordion-wrapper",
						children: /* @__PURE__ */ jsx(ProductAccordion, { details: [
							{
								id: "care",
								title: "Care instructions",
								content: p.careInstructions ? /* @__PURE__ */ jsx("ul", { children: p.careInstructions.map((item, idx) => /* @__PURE__ */ jsx("li", { children: item }, idx)) }) : /* @__PURE__ */ jsx("p", { children: "Ask Chandani for care guidance for the confirmed material and finish." })
							},
							{
								id: "availability",
								title: "Availability & lead time",
								content: /* @__PURE__ */ jsxs("div", { children: [
									/* @__PURE__ */ jsxs("p", { children: [
										/* @__PURE__ */ jsx("strong", { children: "Timeline:" }),
										" ",
										p.availability ?? "Made to order in Kathmandu · 3–5 weeks"
									] }),
									/* @__PURE__ */ jsx("p", { children: "Joinery pieces and custom upholstery are made to order in our Kathmandu Valley workshop, with select pieces available for immediate inspection and delivery from our showroom floor." }),
									/* @__PURE__ */ jsx("p", {
										className: "fineprint",
										children: "Custom sizing, finish adjustments, and fabric selections are confirmed directly with your design advisor before production."
									})
								] })
							},
							{
								id: "delivery",
								title: "Delivery & room placement",
								content: /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", { children: [
									/* @__PURE__ */ jsx("strong", { children: "Delivery service:" }),
									" ",
									p.deliveryInfo ?? "Direct delivery and placement in Kathmandu Valley"
								] }), /* @__PURE__ */ jsxs("ul", { children: [
									/* @__PURE__ */ jsx("li", { children: "Scheduled delivery window with dedicated team" }),
									/* @__PURE__ */ jsx("li", { children: "Careful placement inside your room of choice" }),
									/* @__PURE__ */ jsx("li", { children: "Assembly, unboxing, leveling, and hardware checks" }),
									/* @__PURE__ */ jsx("li", { children: "Outside Kathmandu Valley delivery coordinated with insured transport partners" })
								] })] })
							}
						] })
					}),
					/* @__PURE__ */ jsx(BespokeProjectEstimator, {
						product: p,
						onEnquire: (scope, notes) => openEnquiry(p.name, "private", notes)
					}),
					/* @__PURE__ */ jsx(TradeConciergeCard, {
						onTrade: () => openEnquiry(p.name, "trade"),
						onSwatch: () => openEnquiry(p.name, "swatch")
					}),
					/* @__PURE__ */ jsx(AtelierProvenance, {}),
					/* @__PURE__ */ jsx(ArchitecturalSpatialNotes, {}),
					/* @__PURE__ */ jsx(KathmanduShowroomCard, { onBookVisit: () => openEnquiry("Baber Mahal Showroom Viewing", "private", "Requesting a private gallery viewing appointment at Baber Mahal Revisited.") })
				]
			}),
			related.length > 0 && /* @__PURE__ */ jsxs(RevealSection, {
				className: "product-related-full section",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "section-heading",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "COORDINATING PIECES"
					}), /* @__PURE__ */ jsx("h2", { children: "Complete the space." })] }), /* @__PURE__ */ jsxs(SiteLink, {
						className: "text-link",
						to: "/#collection",
						children: ["Explore the whole collection ", /* @__PURE__ */ jsx(Icon, {})]
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "product-grid",
					children: related.map((rel) => /* @__PURE__ */ jsxs("article", {
						className: "product-card",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "product-visual",
							children: [/* @__PURE__ */ jsx("button", {
								className: "product-image",
								onClick: () => openProduct(rel.id),
								"aria-label": `Explore ${rel.name}`,
								children: /* @__PURE__ */ jsx("img", {
									src: asset(rel.image),
									alt: rel.name,
									loading: "lazy",
									style: focusStyle(rel)
								})
							}), /* @__PURE__ */ jsx(SaveButton, {
								id: rel.id,
								className: "save-button"
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "product-info",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: /* @__PURE__ */ jsx("button", {
								onClick: () => openProduct(rel.id),
								children: rel.name
							}) }), /* @__PURE__ */ jsx("p", { children: rel.palette })] }), /* @__PURE__ */ jsx("button", {
								className: "icon-button",
								onClick: () => openProduct(rel.id),
								"aria-label": `View ${rel.name}`,
								children: /* @__PURE__ */ jsx(Icon, {})
							})]
						})]
					}, rel.id))
				})]
			})
		]
	});
}
//#endregion
//#region src/pages/AtelierPage.tsx
function AtelierPage() {
	const { openEnquiry } = useApp();
	return /* @__PURE__ */ jsxs("article", {
		className: "atelier-page-container",
		children: [
			/* @__PURE__ */ jsx("section", {
				className: "atelier-hero-section section",
				children: /* @__PURE__ */ jsxs("div", {
					className: "atelier-hero-inner",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "eyebrow",
							children: "CHANDANI ATELIER NEPAL"
						}),
						/* @__PURE__ */ jsxs("h1", { children: [
							"Crafted in silence.",
							/* @__PURE__ */ jsx("br", {}),
							"Built for generations."
						] }),
						/* @__PURE__ */ jsx("p", {
							className: "atelier-hero-lead",
							children: "In the ancient craft quarters of the Kathmandu Valley, Chandani brings together centuries of Newar woodworking tradition, Tibetan hand-knotted highland wool, and clean architectural lines."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "atelier-hero-actions",
							children: [/* @__PURE__ */ jsxs(MotionButton, {
								className: "button",
								onClick: () => openEnquiry("Whole home"),
								children: ["Start a project conversation ", /* @__PURE__ */ jsx(Icon, {})]
							}), /* @__PURE__ */ jsx(SiteLink, {
								to: "/?category=carpets#collection",
								className: "text-link",
								children: "Explore the collection ↓"
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ jsxs(RevealSection, {
				className: "atelier-craft-section section",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "section-heading",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "OUR PHILOSOPHY"
					}), /* @__PURE__ */ jsxs("h2", { children: [
						"Three living materials.",
						/* @__PURE__ */ jsx("br", {}),
						"Zero synthetic shortcuts."
					] })] }), /* @__PURE__ */ jsx("p", { children: "We believe a home should be grounded in natural substances that breathe, age with grace, and never emit volatile compounds." })]
				}), /* @__PURE__ */ jsxs("div", {
					className: "craft-pillars-grid",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "craft-pillar-card",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "pillar-index",
									children: "01"
								}),
								/* @__PURE__ */ jsx("h3", { children: "Himalayan Highland Wool" }),
								/* @__PURE__ */ jsx("p", { children: "Sheared from mountain sheep grazing at altitudes above 3,500 meters, this wool is extraordinarily rich in natural lanolin. Hand-carded and spun on traditional drop spindles in the Kathmandu Valley, our carpets achieve a density of 100 knots per square inch." }),
								/* @__PURE__ */ jsxs("ul", {
									className: "pillar-specs",
									children: [
										/* @__PURE__ */ jsx("li", { children: "Naturally flame retardant and soil repellent" }),
										/* @__PURE__ */ jsx("li", { children: "Washed in glacial mountain spring waters" }),
										/* @__PURE__ */ jsx("li", { children: "Zero petroleum backing or chemical adhesives" })
									]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "craft-pillar-card",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "pillar-index",
									children: "02"
								}),
								/* @__PURE__ */ jsx("h3", { children: "Patan Master Joinery" }),
								/* @__PURE__ */ jsx("p", { children: "Our timber pieces are built in collaboration with generational master woodcarvers of Patan. Every rail, trestle, and plinth is connected using wood-pinned mortise-and-tenon joinery that accommodates natural atmospheric expansion without warping." }),
								/* @__PURE__ */ jsxs("ul", {
									className: "pillar-specs",
									children: [
										/* @__PURE__ */ jsx("li", { children: "Sustainably harvested FSC certified white oak & walnut" }),
										/* @__PURE__ */ jsx("li", { children: "Hidden underside steel tension rods for tabletop flatness" }),
										/* @__PURE__ */ jsx("li", { children: "Sculpted bullnose radii shaped entirely by hand plane" })
									]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "craft-pillar-card",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "pillar-index",
									children: "03"
								}),
								/* @__PURE__ */ jsx("h3", { children: "Organic Living Finishes" }),
								/* @__PURE__ */ jsx("p", { children: "Rather than sealing wood beneath synthetic polyurethane coatings, we hand-buff each surface with cold-pressed walnut oil and raw Himalayan beeswax. The timber remains tactile to the touch and develops a deep, lustrous patina over decades." }),
								/* @__PURE__ */ jsxs("ul", {
									className: "pillar-specs",
									children: [
										/* @__PURE__ */ jsx("li", { children: "100% Non-toxic, food-safe and child-safe" }),
										/* @__PURE__ */ jsx("li", { children: "Breathable barrier that resists daily moisture" }),
										/* @__PURE__ */ jsx("li", { children: "Easily refreshed with our organic maintenance wax" })
									]
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs(RevealSection, {
				className: "atelier-process-section section",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "section-heading",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "HOW WE WORK"
					}), /* @__PURE__ */ jsxs("h2", { children: [
						"From space study",
						/* @__PURE__ */ jsx("br", {}),
						"to dedicated room placement."
					] })] }), /* @__PURE__ */ jsx("p", { children: "Whether commissioning a single statement dining table or an entire architectural residence suite, our collaborative process ensures complete clarity." })]
				}), /* @__PURE__ */ jsxs("div", {
					className: "process-timeline",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "process-step",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "step-badge",
									children: "Phase 01"
								}),
								/* @__PURE__ */ jsx("h4", { children: "Spatial Dialogue & Scale Audit" }),
								/* @__PURE__ */ jsx("p", { children: "We begin with your floorplans, architectural photography, or an in-person consultation at our Baber Mahal gallery. We map traffic circulation and natural lighting to confirm optimal proportions." })
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "process-step",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "step-badge",
									children: "Phase 02"
								}),
								/* @__PURE__ */ jsx("h4", { children: "Physical Material Review" }),
								/* @__PURE__ */ jsx("p", { children: "We provide authentic timber samples in Sisau and Smoked Walnut, raw Belgian linen weaves, and Tibetan wool swatches so you can test them in your room's natural morning and evening light." })
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "process-step",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "step-badge",
									children: "Phase 03"
								}),
								/* @__PURE__ */ jsx("h4", { children: "Atelier Bench Production" }),
								/* @__PURE__ */ jsx("p", { children: "Your piece is assigned to a dedicated master artisan in our Patan workshop. We provide periodic video and photographic updates as the timber is joined, hand-sanded, and waxed." })
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "process-step",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "step-badge",
									children: "Phase 04"
								}),
								/* @__PURE__ */ jsx("h4", { children: "Dedicated Room Placement" }),
								/* @__PURE__ */ jsx("p", { children: "Our specialist two-person logistics crew delivers directly into your room of choice, levels the piece, secures structural anchor points, and takes away all protective packaging for recycling." })
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs(RevealSection, {
				className: "atelier-locations-section section",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "section-heading",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "VISIT US"
					}), /* @__PURE__ */ jsx("h2", { children: "Our Galleries in Nepal" })] }), /* @__PURE__ */ jsx("p", { children: "Experience our furniture and hand-knotted carpets in person under natural daylight." })]
				}), /* @__PURE__ */ jsxs("div", {
					className: "locations-grid",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "location-card",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "location-tag",
								children: "Flagship Gallery"
							}),
							/* @__PURE__ */ jsx("h3", { children: "Baber Mahal Revisited" }),
							/* @__PURE__ */ jsx("p", {
								className: "location-address",
								children: "Courtyard II, Baber Mahal, Kathmandu, Nepal"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "location-hours",
								children: [/* @__PURE__ */ jsx("strong", { children: "Gallery Hours:" }), /* @__PURE__ */ jsxs("p", { children: [
									"Monday to Saturday: 10:00 to 18:00",
									/* @__PURE__ */ jsx("br", {}),
									"Sunday: By private appointment"
								] })]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "location-contact",
								children: /* @__PURE__ */ jsx("p", { children: "Direct: +977 1 552 4890 · atelier@chandani.com.np" })
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								className: "button outline",
								onClick: () => openEnquiry("Baber Mahal Gallery Visit", "private", "Requesting private appointment at Baber Mahal Revisited."),
								children: "Book gallery consultation"
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "location-card",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "location-tag",
								children: "Artisan Studio & Workshop"
							}),
							/* @__PURE__ */ jsx("h3", { children: "Patan Craft Quarter" }),
							/* @__PURE__ */ jsx("p", {
								className: "location-address",
								children: "Patan Industrial Estate, Lalitpur, Nepal"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "location-hours",
								children: [/* @__PURE__ */ jsx("strong", { children: "Studio Visits:" }), /* @__PURE__ */ jsx("p", { children: "By private reservation for interior designers, architects, and bespoke patrons." })]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "location-contact",
								children: /* @__PURE__ */ jsx("p", { children: "Concierge WhatsApp: +977 980 123 4567" })
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								className: "button outline",
								onClick: () => openEnquiry("Patan Workshop Visit", "trade", "Trade studio visit to observe woodworking and loom weaving."),
								children: "Reserve workshop tour"
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ jsx(RevealSection, {
				className: "atelier-trade-banner section",
				children: /* @__PURE__ */ jsxs("div", {
					className: "trade-banner-inner",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "eyebrow",
							children: "FOR DESIGN PROFESSIONALS"
						}),
						/* @__PURE__ */ jsx("h2", { children: "B2B Trade & Architecture Program" }),
						/* @__PURE__ */ jsx("p", { children: "We partner with interior architects, boutique hoteliers, and residential design studios across Nepal and internationally. Enjoy 20% trade pricing, 2D/3D CAD models, custom dimensions, and COM upholstery support." }),
						/* @__PURE__ */ jsxs("div", {
							className: "trade-banner-ctas",
							children: [/* @__PURE__ */ jsxs("button", {
								type: "button",
								className: "button",
								onClick: () => openEnquiry("Trade Partnership", "trade"),
								children: ["Designer & Architectural Enquiry ", /* @__PURE__ */ jsx(Icon, {})]
							}), /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "button outline",
								onClick: () => openEnquiry("Material Swatches", "swatch"),
								children: "Request Material Swatches"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
//#region src/components/Enquiry.tsx
function estimateArea(dimStr) {
	const match = dimStr.match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[×x*]\s*(\d+(?:\.\d+)?)/i);
	if (!match) return null;
	const w = parseFloat(match[1]);
	const l = parseFloat(match[2]);
	if (isNaN(w) || isNaN(l) || w <= 0 || l <= 0) return null;
	return {
		areaM2: (w * l).toFixed(1),
		areaSqFt: Math.round(w * l * 10.764)
	};
}
function EnquiryForm() {
	const { content, products, saved, enquiry, setEnquiry, setPanel } = useApp();
	const fields = enquiry.fields;
	const choices = [.../* @__PURE__ */ new Set([
		fields.interest,
		"Whole home",
		"Kitchen design",
		"Living room",
		"Bedroom",
		"Dining room",
		"My shortlist",
		...content.products.map((p) => p.name)
	])];
	const dimensionPresets = [
		"4 m × 3 m",
		"5 m × 4 m",
		"6 m × 4 m",
		"3.5 m × 3 m"
	];
	const areaEst = estimateArea(fields.dimensions);
	const filledCount = [
		fields.interest,
		fields.name || fields.contact,
		fields.dimensions,
		fields.notes
	].filter(Boolean).length;
	function change(name, value) {
		setEnquiry((previous) => ({
			...previous,
			fields: {
				...previous.fields,
				[name]: value
			},
			...name === "interest" ? { selected: value === "My shortlist" ? saved.map((id) => products[id]) : content.products.filter((p) => p.name === value) } : {}
		}));
	}
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("h2", {
			id: "drawerTitle",
			children: "What do you have in mind?"
		}),
		/* @__PURE__ */ jsx("p", { children: "Start with a piece, a room or an idea." }),
		/* @__PURE__ */ jsxs("div", {
			className: "enquiry-client-types",
			role: "tablist",
			"aria-label": "Select enquiry type",
			children: [
				/* @__PURE__ */ jsx("button", {
					type: "button",
					role: "tab",
					"aria-selected": fields.clientType === "private" || !fields.clientType,
					className: `enquiry-type-tab${fields.clientType === "private" || !fields.clientType ? " active" : ""}`,
					onClick: () => change("clientType", "private"),
					children: "Private Client"
				}),
				/* @__PURE__ */ jsxs("button", {
					type: "button",
					role: "tab",
					"aria-selected": fields.clientType === "trade",
					className: `enquiry-type-tab${fields.clientType === "trade" ? " active" : ""}`,
					onClick: () => change("clientType", "trade"),
					children: ["Trade & Designers ", /* @__PURE__ */ jsx("span", {
						className: "tab-badge",
						children: "Pro"
					})]
				}),
				/* @__PURE__ */ jsxs("button", {
					type: "button",
					role: "tab",
					"aria-selected": fields.clientType === "swatch",
					className: `enquiry-type-tab${fields.clientType === "swatch" ? " active" : ""}`,
					onClick: () => change("clientType", "swatch"),
					children: ["Material Samples ", /* @__PURE__ */ jsx("span", {
						className: "tab-badge",
						children: "Review"
					})]
				})
			]
		}),
		fields.clientType === "trade" && /* @__PURE__ */ jsxs("div", {
			className: "trade-perks-banner",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "trade-perks-header",
					children: [/* @__PURE__ */ jsx("strong", { children: "Architect & Interior Design Concierge" }), /* @__PURE__ */ jsx("span", {
						className: "trade-status-pill",
						children: "● Verified Trade Accounts"
					})]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "trade-perks-sub",
					children: "Exclusive commercial & residential benefits for design professionals:"
				}),
				/* @__PURE__ */ jsxs("ul", {
					className: "trade-perks-list",
					children: [
						/* @__PURE__ */ jsx("li", { children: "Tiered 20% trade discount on bespoke orders (रू 15,00,000+); 25% on whole-home specifications" }),
						/* @__PURE__ */ jsx("li", { children: "Direct workshop concierge with 24h quotation & finish customization turnaround" }),
						/* @__PURE__ */ jsx("li", { children: "Instant 2D/3D CAD (.DWG, .OBJ) files and high-resolution material textures" }),
						/* @__PURE__ */ jsx("li", { children: "COM (Customer’s Own Material) tailoring & commercial contract fire ratings" })
					]
				})
			]
		}),
		fields.clientType === "swatch" && /* @__PURE__ */ jsxs("div", {
			className: "swatch-perks-banner",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "swatch-perks-header",
					children: [/* @__PURE__ */ jsx("strong", { children: "Complimentary Curated Material Box" }), /* @__PURE__ */ jsx("span", {
						className: "trade-status-pill",
						children: "● Dispatches in 48h"
					})]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "swatch-perks-sub",
					children: "Feel the textures in your home’s natural lighting before ordering:"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "swatch-kit-preview",
					"aria-label": "Included swatches",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "swatch-chip-item",
							children: [
								/* @__PURE__ */ jsx("span", { className: "swatch-sample wood-oak" }),
								" ",
								/* @__PURE__ */ jsx("span", { children: "Solid European Oak" })
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "swatch-chip-item",
							children: [
								/* @__PURE__ */ jsx("span", { className: "swatch-sample wood-walnut" }),
								" ",
								/* @__PURE__ */ jsx("span", { children: "American Black Walnut" })
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "swatch-chip-item",
							children: [
								/* @__PURE__ */ jsx("span", { className: "swatch-sample fabric-linen" }),
								" ",
								/* @__PURE__ */ jsx("span", { children: "Belgian Oatmeal Linen" })
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "swatch-chip-item",
							children: [
								/* @__PURE__ */ jsx("span", { className: "swatch-sample fabric-wool" }),
								" ",
								/* @__PURE__ */ jsx("span", { children: "New Zealand Wool" })
							]
						})
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "enquiry-progress-strip",
			"aria-label": "Enquiry completeness",
			children: [/* @__PURE__ */ jsx("div", {
				className: "progress-bar-track",
				children: /* @__PURE__ */ jsx("div", {
					className: "progress-bar-fill",
					style: { width: `${filledCount / 4 * 100}%` }
				})
			}), /* @__PURE__ */ jsxs("span", {
				className: "progress-label",
				children: [filledCount, " of 4 details provided"]
			})]
		}),
		/* @__PURE__ */ jsxs("form", {
			className: "enquiry-form",
			onSubmit: (event) => {
				event.preventDefault();
				setEnquiry({
					...enquiry,
					message: buildDraft(enquiry)
				});
				setPanel({ kind: "draft" });
			},
			children: [
				/* @__PURE__ */ jsx("label", {
					htmlFor: "interest",
					children: "I’m interested in"
				}),
				/* @__PURE__ */ jsx("select", {
					id: "interest",
					name: "interest",
					value: fields.interest,
					onChange: (e) => change("interest", e.target.value),
					children: choices.map((choice) => /* @__PURE__ */ jsx("option", { children: choice }, choice))
				}),
				fields.clientType === "trade" && /* @__PURE__ */ jsxs("div", {
					className: "form-grid",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("label", {
						htmlFor: "firmName",
						children: ["Design practice / Firm ", /* @__PURE__ */ jsx("span", { children: "(optional)" })]
					}), /* @__PURE__ */ jsx("input", {
						id: "firmName",
						name: "firmName",
						placeholder: "e.g. Studio Harrison & Partners",
						value: fields.firmName ?? "",
						onChange: (e) => change("firmName", e.target.value)
					})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
						htmlFor: "projectScope",
						children: "Project typology"
					}), /* @__PURE__ */ jsx("select", {
						id: "projectScope",
						name: "projectScope",
						value: fields.projectScope ?? "High-End Private Residence",
						onChange: (e) => change("projectScope", e.target.value),
						children: [
							"High-End Private Residence",
							"Boutique Hotel / Hospitality",
							"Commercial / Executive Office",
							"Multi-Residential Development",
							"Showhome Staging"
						].map((opt) => /* @__PURE__ */ jsx("option", { children: opt }, opt))
					})] })]
				}),
				fields.clientType === "swatch" && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("label", {
					htmlFor: "shippingAddress",
					children: ["Delivery address & postal code ", /* @__PURE__ */ jsx("span", { children: "(optional)" })]
				}), /* @__PURE__ */ jsx("input", {
					id: "shippingAddress",
					name: "shippingAddress",
					placeholder: "Street address, city, postal code",
					value: fields.shippingAddress ?? "",
					onChange: (e) => change("shippingAddress", e.target.value)
				})] }),
				/* @__PURE__ */ jsxs("div", {
					className: "form-grid",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("label", {
						htmlFor: "enquiryName",
						children: ["Your name ", /* @__PURE__ */ jsx("span", { children: "(optional)" })]
					}), /* @__PURE__ */ jsx("input", {
						id: "enquiryName",
						name: "name",
						autoComplete: "name",
						value: fields.name,
						onChange: (e) => change("name", e.target.value)
					})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("label", {
						htmlFor: "enquiryContact",
						children: ["Email or phone ", /* @__PURE__ */ jsx("span", { children: "(optional)" })]
					}), /* @__PURE__ */ jsx("input", {
						id: "enquiryContact",
						name: "contact",
						value: fields.contact,
						onChange: (e) => change("contact", e.target.value)
					})] })]
				}),
				/* @__PURE__ */ jsxs("div", {
					hidden: !fields.interest.startsWith("Kitchen"),
					children: [/* @__PURE__ */ jsx("label", {
						htmlFor: "kitchenLayout",
						children: "Layout you have in mind"
					}), /* @__PURE__ */ jsx("select", {
						id: "kitchenLayout",
						name: "layout",
						value: fields.layout,
						onChange: (e) => change("layout", e.target.value),
						children: [
							"Not sure yet",
							"Straight kitchen",
							"L-shaped kitchen",
							"U-shaped kitchen",
							"Kitchen with an island"
						].map((layout) => /* @__PURE__ */ jsx("option", { children: layout }, layout))
					})]
				}),
				fields.clientType !== "swatch" && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsxs("label", {
						htmlFor: "dimensions",
						children: ["Room dimensions ", /* @__PURE__ */ jsx("span", { children: "(optional)" })]
					}),
					/* @__PURE__ */ jsx("input", {
						id: "dimensions",
						name: "dimensions",
						placeholder: "For example, 4 m × 3 m",
						value: fields.dimensions,
						onChange: (e) => change("dimensions", e.target.value)
					}),
					/* @__PURE__ */ jsx("div", {
						className: "dimension-presets",
						role: "group",
						"aria-label": "Quick room dimension suggestions",
						children: dimensionPresets.map((preset) => /* @__PURE__ */ jsx("button", {
							type: "button",
							className: `preset-chip${fields.dimensions === preset ? " active" : ""}`,
							onClick: () => change("dimensions", preset),
							children: preset
						}, preset))
					}),
					areaEst && /* @__PURE__ */ jsx("div", {
						className: "enquiry-area-helper",
						"aria-live": "polite",
						children: /* @__PURE__ */ jsxs("span", { children: [
							"Estimated floor area: ",
							/* @__PURE__ */ jsxs("strong", { children: [
								"~",
								areaEst.areaM2,
								" m²"
							] }),
							" (",
							areaEst.areaSqFt,
							" sq ft)"
						] })
					})
				] }),
				/* @__PURE__ */ jsxs("label", {
					htmlFor: "enquiryNotes",
					children: ["A little about your space & timeline ", /* @__PURE__ */ jsx("span", { children: "(optional)" })]
				}),
				/* @__PURE__ */ jsx("textarea", {
					id: "enquiryNotes",
					name: "notes",
					placeholder: fields.clientType === "trade" ? "Project location, square footage, CAD requirements, or installation deadline..." : "What would you like to change? Any colours or ideas in mind?",
					value: fields.notes,
					onChange: (e) => change("notes", e.target.value)
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "enquiry-char-helper",
					children: [/* @__PURE__ */ jsxs("span", { children: [fields.notes.length, " characters"] }), fields.notes.length > 25 && /* @__PURE__ */ jsx("span", {
						className: "notes-pill",
						children: "● Helpful detail"
					})]
				}),
				/* @__PURE__ */ jsxs("button", {
					className: "button",
					type: "submit",
					children: ["Prepare my enquiry ", /* @__PURE__ */ jsx(Icon, {})]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "fineprint",
					children: "This preview prepares a draft for you to copy. It does not send your details."
				})
			]
		})
	] });
}
function EnquiryDraft() {
	const { enquiry, setEnquiry, setPanel, notify } = useApp();
	const input = useRef(null);
	const [status, setStatus] = useState("Nothing has been sent.");
	async function copy() {
		try {
			await navigator.clipboard.writeText(enquiry.message);
			setStatus("Copied. You can paste your enquiry into a message.");
			notify("Enquiry copied");
		} catch {
			input.current?.focus();
			input.current?.select();
			setStatus("Select and copy the message above with your keyboard.");
		}
	}
	const mailtoUrl = `mailto:studio@chandani.interior?subject=${encodeURIComponent(`Chandani Interior Consultation: ${enquiry.fields.interest}`)}&body=${encodeURIComponent(enquiry.message)}`;
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("h2", {
			id: "drawerTitle",
			children: "A starting point."
		}),
		/* @__PURE__ */ jsx("p", { children: "Your draft is ready to copy and share with Chandani." }),
		/* @__PURE__ */ jsx("label", {
			className: "eyebrow",
			htmlFor: "messagePreview",
			style: { marginTop: 22 },
			children: "YOUR MESSAGE"
		}),
		/* @__PURE__ */ jsx("textarea", {
			ref: input,
			className: "message-preview",
			id: "messagePreview",
			value: enquiry.message,
			onChange: (e) => setEnquiry({
				...enquiry,
				message: e.target.value
			})
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "draft-actions",
			children: [/* @__PURE__ */ jsxs("button", {
				className: "button",
				onClick: copy,
				children: ["Copy enquiry ", /* @__PURE__ */ jsx(Icon, {})]
			}), /* @__PURE__ */ jsx("button", {
				className: "button outline",
				onClick: () => setPanel({ kind: "enquiry" }),
				children: "Edit details"
			})]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "draft-direct-email",
			children: /* @__PURE__ */ jsx("a", {
				className: "button outline direct-mail-btn",
				href: mailtoUrl,
				children: "Open in email client ↗"
			})
		}),
		/* @__PURE__ */ jsx("p", {
			className: "fineprint",
			role: "status",
			children: status
		})
	] });
}
//#endregion
//#region src/components/Drawer.tsx
function Drawer() {
	const { panel, products, closePanel } = useApp();
	const dialog = useDialog();
	const close = useRef(null);
	useLayoutEffect(() => {
		dialog.current.scrollTop = 0;
		if (panel?.kind === "search") dialog.current?.querySelector("input[type=search]")?.focus();
		else close.current?.focus({ preventScroll: true });
	}, [panel, dialog]);
	if (!panel) return null;
	const label = panel.kind === "product" ? products[panel.id].type.toUpperCase() : {
		search: "EXPLORE CHANDANI",
		shortlist: "YOUR SELECTION",
		menu: "CHANDANI",
		enquiry: "LET’S TALK ABOUT YOUR HOME",
		draft: "YOUR ENQUIRY",
		atelier: "THE ATELIER STORY"
	}[panel.kind];
	return /* @__PURE__ */ jsxs("dialog", {
		id: "drawer",
		ref: dialog,
		"data-lenis-prevent": true,
		"aria-labelledby": "drawerTitle",
		onCancel: (event) => {
			event.preventDefault();
			closePanel();
		},
		onClick: (event) => {
			if (outsideDialog(event)) closePanel();
		},
		children: [/* @__PURE__ */ jsxs("div", {
			className: "drawer-head",
			children: [/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: label
			}), /* @__PURE__ */ jsx("button", {
				ref: close,
				className: "icon-button",
				onClick: closePanel,
				"aria-label": "Close panel",
				children: /* @__PURE__ */ jsx(Icon, { name: "close" })
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "drawer-body",
			children: [
				panel.kind === "product" && /* @__PURE__ */ jsx(ProductDetails, { id: panel.id }),
				panel.kind === "search" && /* @__PURE__ */ jsx(Search, {}),
				panel.kind === "shortlist" && /* @__PURE__ */ jsx(Shortlist, {}),
				panel.kind === "menu" && /* @__PURE__ */ jsx(MobileNavigation, {}),
				panel.kind === "enquiry" && /* @__PURE__ */ jsx(EnquiryForm, {}),
				panel.kind === "draft" && /* @__PURE__ */ jsx(EnquiryDraft, {}),
				panel.kind === "atelier" && /* @__PURE__ */ jsx(AtelierDrawerStory, {})
			]
		})]
	});
}
function AtelierDrawerStory() {
	const { openEnquiry } = useApp();
	return /* @__PURE__ */ jsxs("div", {
		className: "drawer-atelier-story",
		style: { padding: "4px 0 24px" },
		children: [
			/* @__PURE__ */ jsxs("h2", {
				id: "drawerTitle",
				style: {
					fontSize: "28px",
					lineHeight: 1.15,
					marginBottom: "16px"
				},
				children: [
					"Crafted in silence.",
					/* @__PURE__ */ jsx("br", {}),
					"Built for generations."
				]
			}),
			/* @__PURE__ */ jsx("p", {
				style: {
					color: "var(--muted)",
					fontSize: "13px",
					lineHeight: 1.7,
					marginBottom: "24px"
				},
				children: "In the ancient craft quarters of the Kathmandu Valley, Chandani brings together centuries of Newar woodworking tradition, Tibetan hand-knotted highland wool, and clean architectural lines."
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: "16px",
					marginBottom: "28px"
				},
				children: [
					/* @__PURE__ */ jsxs("div", {
						style: {
							background: "var(--white)",
							border: "1px solid var(--line)",
							padding: "16px",
							borderRadius: "6px"
						},
						children: [
							/* @__PURE__ */ jsx("span", {
								style: {
									color: "var(--rust)",
									fontSize: "11px",
									fontWeight: 600,
									textTransform: "uppercase",
									letterSpacing: "0.08em"
								},
								children: "01 / Highland Tibetan Wool"
							}),
							/* @__PURE__ */ jsx("h4", {
								style: {
									margin: "4px 0 6px",
									fontSize: "15px"
								},
								children: "Lanolin-Rich Mountain Fibers"
							}),
							/* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									fontSize: "12px",
									color: "var(--muted)",
									lineHeight: 1.5
								},
								children: "Sheared above 3,500m and hand-spun on drop spindles. Naturally flame-retardant and soil-resistant with 100 knots per square inch."
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							background: "var(--white)",
							border: "1px solid var(--line)",
							padding: "16px",
							borderRadius: "6px"
						},
						children: [
							/* @__PURE__ */ jsx("span", {
								style: {
									color: "var(--rust)",
									fontSize: "11px",
									fontWeight: 600,
									textTransform: "uppercase",
									letterSpacing: "0.08em"
								},
								children: "02 / Patan Joinery"
							}),
							/* @__PURE__ */ jsx("h4", {
								style: {
									margin: "4px 0 6px",
									fontSize: "15px"
								},
								children: "Mortise-and-Tenon Architecture"
							}),
							/* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									fontSize: "12px",
									color: "var(--muted)",
									lineHeight: 1.5
								},
								children: "Bench-made solid walnut, oak, and sal wood frames crafted without synthetic screws, allowing the wood to breathe across seasons."
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							background: "var(--white)",
							border: "1px solid var(--line)",
							padding: "16px",
							borderRadius: "6px"
						},
						children: [
							/* @__PURE__ */ jsx("span", {
								style: {
									color: "var(--rust)",
									fontSize: "11px",
									fontWeight: 600,
									textTransform: "uppercase",
									letterSpacing: "0.08em"
								},
								children: "03 / Flagship Viewing Gallery"
							}),
							/* @__PURE__ */ jsx("h4", {
								style: {
									margin: "4px 0 6px",
									fontSize: "15px"
								},
								children: "Baber Mahal Revisited · Courtyard II"
							}),
							/* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									fontSize: "12px",
									color: "var(--muted)",
									lineHeight: 1.5
								},
								children: "Private viewing sessions by appointment. Touch raw wool skeins, timber finishes, and experience room scales in person."
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: "10px"
				},
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "button",
					onClick: () => openEnquiry("Whole home"),
					children: "Book an Atelier Consultation →"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "button outline",
					onClick: () => openEnquiry("Material Swatches", "swatch"),
					children: "Request Material & Finish Samples"
				})]
			})
		]
	});
}
//#endregion
//#region src/App.tsx
function LegacyRedirect({ path }) {
	const location = useLocation();
	return /* @__PURE__ */ jsx(Navigate, {
		replace: true,
		to: `${path}${location.search}${location.hash}`
	});
}
function App() {
	const { panel, tryEntry, toastMessage, setPanel } = useApp();
	const reducedMotion = useMotionPreference();
	const modalOpen = !!panel || !!tryEntry;
	const location = useLocation();
	const lastScrollTarget = useRef("");
	const [showScrollTop, setShowScrollTop] = useState(false);
	useEffect(() => {
		function handleKeyDown(event) {
			if (modalOpen) return;
			const target = event.target;
			if (target && [
				"INPUT",
				"TEXTAREA",
				"SELECT"
			].includes(target.tagName)) return;
			if (target?.isContentEditable) return;
			if ((event.key === "/" || (event.metaKey || event.ctrlKey) && event.key === "k") && !event.shiftKey) {
				event.preventDefault();
				setPanel({ kind: "search" });
			} else if ((event.key === "s" || event.key === "S") && !event.metaKey && !event.ctrlKey) {
				event.preventDefault();
				setPanel({ kind: "shortlist" });
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [modalOpen, setPanel]);
	useEffect(() => {
		function handleScroll() {
			setShowScrollTop(window.scrollY > 400);
		}
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);
	useEffect(() => {
		if (reducedMotion || modalOpen) return;
		const lenis = new Lenis({
			duration: 1.1,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			touchMultiplier: 1.5,
			infinite: false
		});
		let rafId;
		function raf(time) {
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
		if (location.pathname === "/carpet-studio") document.title = "Chandani · The carpet studio";
		else if (location.pathname === "/atelier") document.title = "Chandani · The Atelier Story";
		else if (location.pathname.startsWith("/product/")) {
			const prodId = location.pathname.split("/")[2];
			document.title = prodId ? `Chandani · ${prodId.charAt(0).toUpperCase() + prodId.slice(1)}` : "Chandani · Collection";
		} else document.title = "Chandani · Furniture, carpets & interiors";
	}, [location.pathname]);
	useEffect(() => {
		const address = location.pathname + location.hash;
		const changed = lastScrollTarget.current !== address;
		lastScrollTarget.current = address;
		if (!location.hash || !changed && !location.state?.scrollHash) return;
		const target = document.getElementById(location.hash.slice(1));
		if (target) requestAnimationFrame(() => target.scrollIntoView({
			behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
			block: "start"
		}));
	}, [
		location.pathname,
		location.hash,
		location.key
	]);
	useEffect(() => {
		if (!location.hash) window.scrollTo({
			top: 0,
			behavior: "instant"
		});
	}, [location.pathname]);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("a", {
			className: "skip",
			href: "#main",
			children: "Skip to content"
		}),
		/* @__PURE__ */ jsx(Header, {}),
		/* @__PURE__ */ jsx("main", {
			id: "main",
			tabIndex: -1,
			children: /* @__PURE__ */ jsxs(Routes, { children: [
				/* @__PURE__ */ jsx(Route, {
					path: "/",
					element: /* @__PURE__ */ jsx(Home, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/carpet-studio",
					element: /* @__PURE__ */ jsx(CarpetStudio, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/product/:id",
					element: /* @__PURE__ */ jsx(ProductPage, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/atelier",
					element: /* @__PURE__ */ jsx(AtelierPage, {})
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/index.html",
					element: /* @__PURE__ */ jsx(LegacyRedirect, { path: "/" })
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "/atelier.html",
					element: /* @__PURE__ */ jsx(LegacyRedirect, { path: "/carpet-studio" })
				}),
				/* @__PURE__ */ jsx(Route, {
					path: "*",
					element: /* @__PURE__ */ jsxs("section", {
						className: "section",
						children: [/* @__PURE__ */ jsx("h1", { children: "Let’s find your way home." }), /* @__PURE__ */ jsx(SiteLink, {
							className: "text-link",
							to: "/",
							children: "Explore Chandani →"
						})]
					})
				})
			] })
		}),
		/* @__PURE__ */ jsx(Footer, {}),
		panel && /* @__PURE__ */ jsx(Drawer, {}),
		tryEntry && /* @__PURE__ */ jsx(TryRoomDialog, { initial: tryEntry }),
		/* @__PURE__ */ jsx(Toaster, {
			position: "bottom-right",
			toastOptions: { className: "chandani-toast" },
			closeButton: true
		}),
		/* @__PURE__ */ jsx("div", {
			className: `toast${toastMessage ? " visible" : ""}`,
			role: "status",
			"aria-live": "polite",
			children: toastMessage
		}),
		showScrollTop && /* @__PURE__ */ jsx("button", {
			type: "button",
			className: "scroll-to-top-btn",
			onClick: () => window.scrollTo({
				top: 0,
				behavior: reducedMotion ? "instant" : "smooth"
			}),
			"aria-label": "Scroll to top of page",
			children: "↑"
		})
	] });
}
//#endregion
//#region tests/render-reference.tsx
var content = await localCatalogueService.loadContent();
mkdirSync("test-results/markup", { recursive: true });
for (const [name, path] of [
	["home", "/"],
	["studio", "/carpet-studio"],
	["bedroom", "/?room=bedroom&piece=wardrobe"],
	["carpets", "/?category=carpets"]
]) {
	const html = renderToStaticMarkup(/* @__PURE__ */ jsx(InteractionProvider, { children: /* @__PURE__ */ jsx(MemoryRouter, {
		initialEntries: [path],
		children: /* @__PURE__ */ jsx(AppProvider, {
			content,
			children: /* @__PURE__ */ jsx(App, {})
		})
	}) }));
	writeFileSync(`test-results/markup/${name}.html`, html);
	assert.doesNotMatch(html, /iframe|data:image/);
	assert.match(html, /chandani/);
	if (name === "bedroom") assert.match(html, /scene exploring/);
	if (name === "carpets") assert.match(html, />3 pieces</);
	console.log(`Rendered React route: ${path}`);
}
for (const [name, room, item] of [
	[
		"try-sofa",
		"living",
		"sofa"
	],
	[
		"try-kitchen",
		"kitchen",
		"kitchen"
	],
	[
		"try-carpet",
		"living",
		"carpet"
	]
]) {
	const html = renderToStaticMarkup(/* @__PURE__ */ jsx(InteractionProvider, { children: /* @__PURE__ */ jsx(MemoryRouter, { children: /* @__PURE__ */ jsx(AppProvider, {
		content,
		children: /* @__PURE__ */ jsx(TryRoomDialog, { initial: {
			room,
			item
		} })
	}) }) }));
	writeFileSync(`test-results/markup/${name}.html`, html);
}
//#endregion
export {};
