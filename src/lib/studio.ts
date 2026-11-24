// ─────────────────────────────────────────────────────────────────────────────
// Navkriti AI Design Studio (Amazon Bedrock integration module)
// Converts plain-language explanations (e.g. "kurti with chikankari design and
// area around the hand with block pattern design") into:
//   1. Multi-zone custom breakdown (Yoke, Sleeves/Hands, Body, Border)
//   2. Materials, color palette, fair price estimate, and delivery timeline
//   3. Deterministic vector + photographic concept spec (`RenderSpec`)
// ─────────────────────────────────────────────────────────────────────────────

export type Motif = "floral" | "paisley" | "lattice" | "tree" | "geometric";
export type Layout = "kurti" | "panel" | "swatch" | "framed";

export interface ZoneSpec {
  zone: string; // e.g. "Sleeves / Hand Area"
  technique: string; // e.g. "Bagru Block Pattern Border"
  detail: string; // e.g. "Contrast geometric block patti around wrists & cuffs"
}

export interface RenderSpec {
  palette: string[]; // [primary, secondary, accent, deep, paper?]
  motif: Motif;
  sleeveMotif?: Motif;
  layout: Layout;
  seed: number;
  photoUrl?: string;
  zones?: ZoneSpec[];
}

export interface ColorChip {
  name: string;
  hex: string;
}

export interface Draft {
  title: string;
  prompt: string;
  craft: string;
  category: "textiles" | "paintings";
  itemType: string;
  materials: string[];
  colors: ColorChip[];
  budget: number;
  timelineDays: number;
  notes: string;
  assumptions: string[];
  confidence: number;
  zones: ZoneSpec[];
  spec: RenderSpec;
}

interface CraftPreset {
  craft: string;
  category: "textiles" | "paintings";
  motif: Motif;
  layout: Layout;
  colors: ColorChip[];
  materials: string[];
  keywords: string[];
  mult: number;
  photoUrl: string;
}

export const CRAFTS: CraftPreset[] = [
  {
    craft: "Chikankari",
    category: "textiles",
    motif: "floral",
    layout: "kurti",
    mult: 1.35,
    keywords: ["chikan", "chikankari", "lucknowi", "chickenkari", "chicken kari"],
    colors: [
      { name: "Ivory", hex: "#EFE7D8" },
      { name: "Rust", hex: "#C1502E" },
      { name: "Sage", hex: "#8FA98F" },
      { name: "Indigo", hex: "#2B3A8F" },
    ],
    materials: ["Cotton mulmul", "Resham chikankari thread", "Natural block border dye"],
    photoUrl: "/images/concepts/kantha-terracotta.jpg",
  },
  {
    craft: "Custom Tailoring & Boutique",
    category: "textiles",
    motif: "floral",
    layout: "kurti",
    mult: 1.2,
    keywords: ["tailor", "taylor", "stitch", "stitching", "custom fit", "boutique", "alteration", "measured"],
    colors: [
      { name: "Ivory", hex: "#EFE7D8" },
      { name: "Terracotta", hex: "#C1502E" },
      { name: "Indigo", hex: "#2B3A8F" },
      { name: "Gold", hex: "#C9A24B" },
    ],
    materials: ["Handloom cotton", "Contrast block-print trim", "Pure cotton lining"],
    photoUrl: "/images/concepts/kantha-terracotta.jpg",
  },
  {
    craft: "Ajrakh",
    category: "textiles",
    motif: "lattice",
    layout: "swatch",
    mult: 1.3,
    keywords: ["ajrakh", "ajrak", "kutch"],
    colors: [
      { name: "Indigo", hex: "#2B3A8F" },
      { name: "Madder", hex: "#9E2B25" },
      { name: "Ivory", hex: "#EFE7D8" },
      { name: "Iron black", hex: "#26221E" },
    ],
    materials: ["Handloom cotton", "Natural indigo & madder"],
    photoUrl: "/images/concepts/ajrakh-indigo.jpg",
  },
  {
    craft: "Block printing",
    category: "textiles",
    motif: "geometric",
    layout: "swatch",
    mult: 1.15,
    keywords: ["block", "bagru", "dabu", "handblock", "print", "sanganeri"],
    colors: [
      { name: "Indigo", hex: "#2B3A8F" },
      { name: "Rust", hex: "#C66B3D" },
      { name: "Ivory", hex: "#F3EAD8" },
      { name: "Leaf", hex: "#5F7A52" },
    ],
    materials: ["Handloom cotton", "Teakwood block natural pigments"],
    photoUrl: "/images/concepts/ajrakh-indigo.jpg",
  },
  {
    craft: "Bandhani",
    category: "textiles",
    motif: "geometric",
    layout: "panel",
    mult: 1.25,
    keywords: ["bandhani", "bandhej", "tie dye", "tie-dye"],
    colors: [
      { name: "Rose", hex: "#D98E8E" },
      { name: "Marigold", hex: "#E2A03C" },
      { name: "Maroon", hex: "#7E2A2A" },
      { name: "Ivory", hex: "#F3EAD8" },
    ],
    materials: ["Gajji silk", "Natural dyes"],
    photoUrl: "/images/concepts/banarasi-saree.jpg",
  },
  {
    craft: "Kantha",
    category: "textiles",
    motif: "floral",
    layout: "panel",
    mult: 1.15,
    keywords: ["kantha", "running stitch", "shantiniketan"],
    colors: [
      { name: "Terracotta", hex: "#C1502E" },
      { name: "Ivory", hex: "#F3EAD8" },
      { name: "Leaf", hex: "#5F7A52" },
      { name: "Earth", hex: "#8A5A3B" },
    ],
    materials: ["Handloom cotton", "Multi-strand kantha thread"],
    photoUrl: "/images/concepts/kantha-terracotta.jpg",
  },
  {
    craft: "Banarasi handloom",
    category: "textiles",
    motif: "paisley",
    layout: "panel",
    mult: 1.8,
    keywords: ["banarasi", "banaras", "zari", "brocade", "handloom", "silk"],
    colors: [
      { name: "Maroon", hex: "#7E2A2A" },
      { name: "Gold", hex: "#C9A24B" },
      { name: "Ivory", hex: "#F3EAD8" },
      { name: "Deep green", hex: "#2F4F3E" },
    ],
    materials: ["Mulberry silk", "Tested gold zari thread"],
    photoUrl: "/images/concepts/banarasi-saree.jpg",
  },
  {
    craft: "Madhubani",
    category: "paintings",
    motif: "tree",
    layout: "framed",
    mult: 1.2,
    keywords: ["madhubani", "mithila", "folk"],
    colors: [
      { name: "Madder", hex: "#9E2B25" },
      { name: "Turmeric", hex: "#D9A404" },
      { name: "Leaf", hex: "#5F7A52" },
      { name: "Charcoal", hex: "#26221E" },
    ],
    materials: ["Handmade paper", "Natural mineral & plant pigments", "Bamboo nib"],
    photoUrl: "/images/concepts/madhubani.jpg",
  },
  {
    craft: "Pichwai",
    category: "paintings",
    motif: "tree",
    layout: "framed",
    mult: 1.7,
    keywords: ["pichwai", "nathdwara", "shrinathji", "lotus"],
    colors: [
      { name: "Deep green", hex: "#2F4F3E" },
      { name: "Lotus pink", hex: "#E5A9B8" },
      { name: "Gold", hex: "#C9A24B" },
      { name: "Ivory", hex: "#F3EAD8" },
    ],
    materials: ["Starch-primed cotton cloth", "Stone colours", "24k gold leaf"],
    photoUrl: "/images/concepts/pichwai.jpg",
  },
  {
    craft: "Warli",
    category: "paintings",
    motif: "geometric",
    layout: "framed",
    mult: 1.05,
    keywords: ["warli", "tribal"],
    colors: [
      { name: "Earth", hex: "#8A5A3B" },
      { name: "Ivory", hex: "#F3EAD8" },
      { name: "Rust", hex: "#C66B3D" },
      { name: "Charcoal", hex: "#26221E" },
    ],
    materials: ["Canvas", "Terracotta earth base", "Rice-paste white pigment"],
    photoUrl: "/images/concepts/madhubani.jpg",
  },
  {
    craft: "Kalamkari",
    category: "paintings",
    motif: "paisley",
    layout: "framed",
    mult: 1.35,
    keywords: ["kalamkari", "pen work"],
    colors: [
      { name: "Indigo", hex: "#2B3A8F" },
      { name: "Ochre", hex: "#D9A404" },
      { name: "Madder", hex: "#9E2B25" },
      { name: "Ivory", hex: "#F3EAD8" },
    ],
    materials: ["Milk-treated cotton canvas", "Tamarind pen & natural dyes"],
    photoUrl: "/images/concepts/madhubani.jpg",
  },
  {
    craft: "Contemporary",
    category: "paintings",
    motif: "geometric",
    layout: "framed",
    mult: 1.15,
    keywords: ["modern", "contemporary", "abstract", "canvas", "portrait"],
    colors: [
      { name: "Indigo", hex: "#2B3A8F" },
      { name: "Rust", hex: "#C1502E" },
      { name: "Ivory", hex: "#F3EAD8" },
      { name: "Charcoal", hex: "#26221E" },
    ],
    materials: ["Stretched linen canvas", "Heavy-body acrylics"],
    photoUrl: "/images/concepts/abstract-canvas.jpg",
  },
];

const ITEMS: { type: string; keywords: string[]; base: number; days: number; category: "textiles" | "paintings" }[] = [
  { type: "Kurti", keywords: ["kurti", "kurta", "tunic", "kameez"], base: 3200, days: 12, category: "textiles" },
  { type: "Saree", keywords: ["saree", "sari"], base: 12000, days: 28, category: "textiles" },
  { type: "Lehenga", keywords: ["lehenga", "ghagra", "skirt"], base: 18000, days: 35, category: "textiles" },
  { type: "Dupatta", keywords: ["dupatta", "stole", "scarf", "shawl", "odhni"], base: 2600, days: 10, category: "textiles" },
  { type: "Cushion covers", keywords: ["cushion", "pillow"], base: 1400, days: 10, category: "textiles" },
  { type: "Bedspread", keywords: ["bedsheet", "bedspread", "quilt", "razai"], base: 6500, days: 20, category: "textiles" },
  { type: "Table linen", keywords: ["table runner", "table", "placemat", "napkin"], base: 1900, days: 9, category: "textiles" },
  { type: "Tote bag", keywords: ["tote", "bag"], base: 1200, days: 7, category: "textiles" },
  { type: "Jacket", keywords: ["jacket", "overlay", "shrug", "waistcoat", "nehru"], base: 5200, days: 18, category: "textiles" },
  { type: "Dress", keywords: ["dress", "gown", "maxi", "anarkali"], base: 4800, days: 16, category: "textiles" },
  { type: "Blouse", keywords: ["blouse", "choli"], base: 2200, days: 10, category: "textiles" },
  { type: "Fabric", keywords: ["fabric", "metre", "meter", "yardage"], base: 800, days: 7, category: "textiles" },
  { type: "Painting", keywords: ["painting", "artwork", "canvas", "wall art", "mandala", "tree of life"], base: 7200, days: 18, category: "paintings" },
  { type: "Mural", keywords: ["mural", "wall painting"], base: 24000, days: 30, category: "paintings" },
  { type: "Plate set", keywords: ["plate", "platter"], base: 3000, days: 12, category: "paintings" },
];

const COLORS: Record<string, ColorChip> = {
  indigo: { name: "Indigo", hex: "#2B3A8F" },
  blue: { name: "Indigo", hex: "#2B3A8F" },
  teal: { name: "Teal", hex: "#2F6F6D" },
  rust: { name: "Rust", hex: "#C66B3D" },
  terracotta: { name: "Terracotta", hex: "#C1502E" },
  orange: { name: "Rust", hex: "#C66B3D" },
  maroon: { name: "Maroon", hex: "#7E2A2A" },
  red: { name: "Madder red", hex: "#9E2B25" },
  pink: { name: "Rose pink", hex: "#D98E8E" },
  pastel: { name: "Rose pink", hex: "#D98E8E" },
  green: { name: "Leaf green", hex: "#5F7A52" },
  emerald: { name: "Deep green", hex: "#2F4F3E" },
  yellow: { name: "Turmeric", hex: "#D9A404" },
  mustard: { name: "Marigold", hex: "#E2A03C" },
  gold: { name: "Gold", hex: "#C9A24B" },
  ivory: { name: "Ivory", hex: "#F3EAD8" },
  cream: { name: "Ivory", hex: "#F3EAD8" },
  white: { name: "Ivory", hex: "#F3EAD8" },
  black: { name: "Charcoal", hex: "#26221E" },
  grey: { name: "Charcoal", hex: "#26221E" },
  gray: { name: "Charcoal", hex: "#26221E" },
  brown: { name: "Earth brown", hex: "#8A5A3B" },
  earthy: { name: "Earth brown", hex: "#8A5A3B" },
  purple: { name: "Lavender", hex: "#8B7BB4" },
  lavender: { name: "Lavender", hex: "#8B7BB4" },
  sage: { name: "Sage", hex: "#8FA98F" },
};

const OCCASIONS: [string, string][] = [
  ["wedding", "wedding"],
  ["shaadi", "wedding"],
  ["sangeet", "wedding"],
  ["mehendi", "wedding"],
  ["festival", "festive wear"],
  ["diwali", "festive wear"],
  ["pooja", "festive wear"],
  ["navratri", "festive wear"],
  ["gift", "gifting"],
  ["birthday", "a birthday"],
  ["anniversary", "an anniversary"],
  ["office", "work wear"],
  ["work", "work wear"],
  ["daily", "everyday wear"],
  ["home", "home décor"],
  ["living room", "the living room"],
  ["cafe", "a café space"],
  ["café", "a café space"],
];

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");
const round = (n: number, step: number) => Math.round(n / step) * step;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return Math.abs(h | 0);
}

function detectBudget(t: string): number | null {
  const k = t.match(/(\d{1,3}(?:\.\d)?)\s*k\b/);
  if (k) return parseFloat(k[1]) * 1000;
  const lakh = t.match(/(\d{1,2}(?:\.\d)?)\s*lakh/);
  if (lakh) return parseFloat(lakh[1]) * 100000;
  const range = t.match(/(\d{3,6})\s*(?:-|to|–)\s*(\d{3,6})/);
  if (range) return Math.round((parseInt(range[1]) + parseInt(range[2])) / 2);
  const plain = t.match(/(?:under|below|budget|around|about|upto|up to|₹|rs\.?|inr)\s*(\d{3,7})/);
  if (plain) return parseInt(plain[1]);
  return null;
}

function detectDays(t: string): number | null {
  const w = t.match(/(\d{1,2})\s*(?:weeks?|wks?)/);
  if (w) return parseInt(w[1]) * 7;
  const d = t.match(/(\d{1,3})\s*days?/);
  if (d) return parseInt(d[1]);
  if (/(next month|within a month)/.test(t)) return 30;
  if (/(urgent|asap|quickly)/.test(t)) return 7;
  return null;
}

function buildZones(
  t: string,
  itemType: string,
  primaryCraft: string,
  secondaryCraft: string | null,
  colors: ColorChip[],
): { zones: ZoneSpec[]; sleeveMotif: Motif } {
  const c1 = colors[0]?.name ?? "Ivory";
  const c2 = colors[1]?.name ?? "Rust";
  const hasSleeveMention = /(sleeve|hand|wrist|cuff|arm|baju|astin)/.test(t);
  const hasBlockMention = /(block|bagru|dabu|ajrakh|print)/.test(t);
  const hasChikanMention = /(chikan|chikankari|chickenkari|lucknowi|jaali|murri)/.test(t);
  const hasZariMention = /(zari|zardozi|gold|brocade|border)/.test(t);

  const sleeveTech =
    hasSleeveMention && hasBlockMention
      ? "Hand-Block Pattern Border"
      : secondaryCraft ?? (hasBlockMention ? "Bagru Block Print Patti" : hasZariMention ? "Woven Zari Border" : `${primaryCraft} Cuff Work`);

  const sleeveMotif: Motif = hasBlockMention ? "geometric" : secondaryCraft === "Ajrakh" ? "lattice" : "paisley";

  if (["Kurti", "Dress", "Jacket", "Blouse", "Lehenga"].includes(itemType)) {
    return {
      sleeveMotif,
      zones: [
        {
          zone: "Yoke & Neckline",
          technique: hasChikanMention ? "Lucknowi Chikankari (Bakhiya & Murri)" : `${primaryCraft} Center Motif`,
          detail: `Dense hand-work in ${c1.toLowerCase()} & ${c2.toLowerCase()} around the gala/neck panel`,
        },
        {
          zone: "Sleeves & Hand Area",
          technique: sleeveTech,
          detail: hasSleeveMention
            ? `Custom ${sleeveTech.toLowerCase()} around the wrist/hand cuffs in ${c2.toLowerCase()} contrast`
            : `3-inch ${sleeveTech.toLowerCase()} cuff finishing`,
        },
        {
          zone: "Body & Silhouette",
          technique: `${primaryCraft} Booti Field`,
          detail: `Small scattered bootis on breathable ${c1.toLowerCase()} base, tailored to measure`,
        },
        {
          zone: "Hem / Daaman Border",
          technique: secondaryCraft ? `${secondaryCraft} Patti` : "Contrast Hand-Finished Border",
          detail: `Matching ${c2.toLowerCase()} border along the bottom hem and side slits (chaak)`,
        },
      ],
    };
  }

  if (itemType === "Saree" || itemType === "Dupatta") {
    return {
      sleeveMotif,
      zones: [
        {
          zone: "Main Field (Body)",
          technique: primaryCraft,
          detail: `${c1} base with fine all-over ${primaryCraft.toLowerCase()} motifs`,
        },
        {
          zone: "Pallu / End Panels",
          technique: secondaryCraft ?? `${primaryCraft} Grand Panel`,
          detail: `Elaborate ${c2.toLowerCase()} multi-band pallu with traditional tassels`,
        },
        {
          zone: "Selvedge Borders",
          technique: hasZariMention ? "Kadhwa Zari Border" : sleeveTech,
          detail: `4-inch framing border running along both edges`,
        },
      ],
    };
  }

  if (itemType === "Painting" || itemType === "Mural" || itemType === "Plate set") {
    return {
      sleeveMotif: "tree",
      zones: [
        {
          zone: "Central Narrative",
          technique: `${primaryCraft} Brush & Nib Work`,
          detail: `Primary motif rendered in ${c1.toLowerCase()} and ${c2.toLowerCase()} natural pigments`,
        },
        {
          zone: "Double-Line Border",
          technique: "Traditional Geometric Framing",
          detail: `Intricate floral & geometric border framing all four sides`,
        },
        {
          zone: "Base & Surface",
          technique: "Archival Handmade Surface",
          detail: `Treated surface ready for framing and wall mounting`,
        },
      ],
    };
  }

  return {
    sleeveMotif,
    zones: [
      {
        zone: "Center Panel",
        technique: primaryCraft,
        detail: `Handcrafted ${primaryCraft.toLowerCase()} in ${c1.toLowerCase()} & ${c2.toLowerCase()}`,
      },
      {
        zone: "Edges & Piping",
        technique: secondaryCraft ?? "Contrast Double-Stitch",
        detail: `Reinforced artisan edge finishing for durability`,
      },
    ],
  };
}

export function generateDraft(input: { prompt: string; craft?: string | null; category?: string | null }): Draft {
  const prompt = input.prompt.trim();
  const t = norm(prompt);

  // Detect primary and optional secondary craft (e.g., Chikankari + Block printing!)
  const matchedPresets = CRAFTS.filter((c) => c.keywords.some((k) => t.includes(k)));
  const preset =
    (input.craft ? CRAFTS.find((c) => c.craft.toLowerCase() === input.craft!.toLowerCase()) : null) ??
    matchedPresets[0] ??
    (input.category === "paintings" ? CRAFTS.find((c) => c.craft === "Madhubani")! : CRAFTS.find((c) => c.craft === "Chikankari")!);

  const secondaryPreset = matchedPresets.find((c) => c.craft !== preset.craft) ?? null;

  const item =
    ITEMS.find((i) => i.keywords.some((k) => t.includes(k))) ??
    (preset.category === "paintings" ? ITEMS.find((i) => i.type === "Painting")! : ITEMS.find((i) => i.type === "Kurti")!);

  // Colours named in the prompt, else the craft's palette
  const named: ColorChip[] = [];
  for (const [word, chip] of Object.entries(COLORS)) {
    if (t.includes(word) && !named.some((c) => c.name === chip.name)) named.push(chip);
  }
  const colors = (named.length >= 2 ? named.slice(0, 4) : preset.colors).slice(0, 4);
  const palette = [...colors.map((c) => c.hex), "#26221E"];

  const occasion = OCCASIONS.find(([k]) => t.includes(k))?.[1] ?? null;
  const stated = detectBudget(t);
  const itemDays = detectDays(t);

  let mid = item.base * preset.mult * (secondaryPreset ? 1.12 : 1);
  const h = hash(prompt) % 11;
  mid *= 1 + (h - 5) / 100;
  let budget = round(mid, 100);
  if (stated) budget = stated;
  const budgetMax = stated ? round(stated, 50) : round(Math.max(budget * 1.08, budget + 200), 100);
  const timelineDays = Math.max(itemDays ?? item.days, Math.round(item.days * 0.6));

  const isGarment = ["Kurti", "Dress", "Jacket", "Blouse"].includes(item.type);
  const layout: Layout =
    preset.category === "paintings"
      ? "framed"
      : isGarment
        ? "kurti"
        : item.type === "Fabric" || /cushion|table|tote|bedspread/i.test(item.type)
          ? "swatch"
          : "panel";

  const craftLabel = secondaryPreset ? `${preset.craft} + ${secondaryPreset.craft}` : preset.craft;
  const { zones, sleeveMotif } = buildZones(t, item.type, preset.craft, secondaryPreset?.craft ?? null, colors);

  const materials = Array.from(new Set([...preset.materials, ...(secondaryPreset ? secondaryPreset.materials.slice(0, 1) : [])]));

  const titleBits = [colors[0]?.name, craftLabel, item.type].filter(Boolean);
  const title = `${titleBits.join(" ")}${occasion ? ` for ${occasion}` : ""}`.replace(/\s+/g, " ").trim();

  const assumptions: string[] = [];
  if (!stated) assumptions.push(`Estimated at ₹${budgetMax.toLocaleString("en-IN")} based on ${craftLabel.toLowerCase()} artisan rate cards — editable before sending.`);
  if (!itemDays) assumptions.push(`Standard ${timelineDays}-day crafting window for custom ${item.type.toLowerCase()} work.`);
  if (secondaryPreset) assumptions.push(`Combined ${preset.craft} body/yoke with ${secondaryPreset.craft} sleeve & border detailing as requested.`);
  if (assumptions.length === 0) assumptions.push("All custom zones, budget and timeline captured clearly for the artisan.");

  const notes = `Structured as a custom ${craftLabel.toLowerCase()} ${item.type.toLowerCase()} in ${colors.slice(0, 3).map((c) => c.name.toLowerCase()).join(", ")}${occasion ? ` for ${occasion}` : ""}. Zones mapped: ${zones.map((z) => `${z.zone} (${z.technique})`).join(" · ")}.`;

  return {
    title,
    prompt,
    craft: craftLabel,
    category: preset.category,
    itemType: item.type,
    materials,
    colors,
    budget: budgetMax,
    timelineDays,
    notes,
    assumptions,
    confidence: Math.min(97, 74 + (secondaryPreset ? 8 : 0) + (named.length >= 2 ? 6 : 0) + (stated ? 5 : 0) + (hash(prompt) % 4)),
    zones,
    spec: {
      palette,
      motif: preset.motif,
      sleeveMotif,
      layout,
      seed: hash(prompt + craftLabel) % 100000,
      photoUrl: preset.photoUrl,
      zones,
    },
  };
}

// ── helper: distance (km) between two coordinates ──
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

export function formatDistance(km?: number | null) {
  if (km == null) return "";
  if (km < 1) return "under 1 km";
  if (km < 1000) return `${km} km`;
  return `${(km / 1000).toFixed(1)}k km`;
}

export const CITY_COORDS: Record<string, { lat: number; lng: number; state: string }> = {
  jaipur: { lat: 26.9124, lng: 75.7873, state: "Rajasthan" },
  delhi: { lat: 28.6139, lng: 77.209, state: "Delhi" },
  "new delhi": { lat: 28.6139, lng: 77.209, state: "Delhi" },
  mumbai: { lat: 19.076, lng: 72.8777, state: "Maharashtra" },
  bengaluru: { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  bangalore: { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  hyderabad: { lat: 17.385, lng: 78.4867, state: "Telangana" },
  kolkata: { lat: 22.5726, lng: 88.3639, state: "West Bengal" },
  chennai: { lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
  pune: { lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
  ahmedabad: { lat: 23.0225, lng: 72.5714, state: "Gujarat" },
  lucknow: { lat: 26.8467, lng: 80.9462, state: "Uttar Pradesh" },
  varanasi: { lat: 25.3176, lng: 82.9739, state: "Uttar Pradesh" },
  surat: { lat: 21.1702, lng: 72.8311, state: "Gujarat" },
  patna: { lat: 25.5941, lng: 85.1376, state: "Bihar" },
  bhopal: { lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh" },
  indore: { lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
  chandigarh: { lat: 30.7333, lng: 76.7794, state: "Punjab" },
  kochi: { lat: 9.9312, lng: 76.2673, state: "Kerala" },
  guwahati: { lat: 26.1445, lng: 91.7362, state: "Assam" },
};

export function coordsFor(city: string) {
  const key = city.trim().toLowerCase();
  return CITY_COORDS[key] ?? { lat: 26.9124 + (hash(key) % 40) / 10, lng: 75.7873 + (hash(key) % 30) / 10, state: "India" };
}
