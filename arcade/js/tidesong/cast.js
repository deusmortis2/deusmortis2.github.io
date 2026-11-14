// The 24 playable merfolk: mermaids cut from FantasyCreatures/mermaidsheets,
// mermen from mermengrid.jpeg (see castAtlas.js). Names are generic sea names. Each
// entry also has rough colours for the small swimming sprite, and `long`
// for long hair that streams behind it. `turned: "left"` marks the pictures
// drawn turned to the left, which battles mirror so the player faces right.
import { castAtlas } from "./castAtlas.js";
import { artVersion } from "./util.js";

export const mermaids = [
  { hair: "#2a1a12", long: false, name: "Cowrie", skin: "#5a3426", tail: "#c8902a", top: "#3c9a3a" },
  { hair: "#2a1a14", long: true, name: "Feather", skin: "#b0704a", tail: "#b02a30", top: "#c08a50" },
  { hair: "#2a1c18", long: true, name: "Violet", skin: "#c48a62", tail: "#8a5ad0", top: "#9a90b0" },
  { hair: "#2a1a12", long: true, name: "Rainbow", skin: "#b07850", tail: "#e05a6a", top: "#e8703a" },
  { hair: "#1e1614", long: true, name: "Lotus", skin: "#b07a52", tail: "#8a4aa8", top: "#8a4aa8" },
  { hair: "#1e1614", long: true, name: "Orchid", skin: "#d09a70", tail: "#2fa070", top: "#b06a5a", turned: "left" },
  { hair: "#3a2418", long: true, name: "Hibiscus", skin: "#b8805a", tail: "#3a90d8", top: "#3a8ad8" },
  { hair: "#3a2a1e", long: true, name: "Sunfin", skin: "#6a3e2a", tail: "#2a80c8", top: "#d0782a", turned: "left" },
  { hair: "#1a1418", long: false, name: "Blossom", skin: "#f6dcc8", tail: "#f08ab0", top: "#f08ab0" },
  { hair: "#2a1c18", long: true, name: "Lagoon", skin: "#b8805a", tail: "#2ab0b0", top: "#a0603a" },
  { hair: "#2a1a14", long: true, name: "Ember", skin: "#b0704a", tail: "#e8803a", top: "#3a6ac8" },
  { hair: "#e8cc88", long: true, name: "Pearl", skin: "#f8dcc8", tail: "#8ac8e8", top: "#b8a0e0", turned: "left" },
];

export const mermen = [
  { hair: "#1a1210", long: false, name: "Riptide", skin: "#4a2a1c", tail: "#4aa02a", top: "#3a8a2a" },
  { hair: "#1a1210", long: false, name: "Current", skin: "#6a3a22", tail: "#a04a2a", top: "#8a4a2a" },
  { hair: "#1e1614", long: false, name: "Drift", skin: "#c08a62", tail: "#2aa0a0", top: "#2a8a8a" },
  { hair: "#1e1614", long: false, name: "Harbour", skin: "#b07850", tail: "#e8dcc0", top: "#6a4a2a" },
  { hair: "#1e1614", long: false, name: "Delta", skin: "#9a6040", tail: "#8a5a6a", top: "#7a4a2a" },
  { hair: "#1a1418", long: true, name: "Storm", skin: "#f0d0b0", tail: "#6a8ac8", top: "#3a5a8a" },
  { hair: "#1a1418", long: false, name: "Atoll", skin: "#c89a70", tail: "#5a3a24", top: "#6a4a2a" },
  { hair: "#1e1614", long: true, name: "Breaker", skin: "#9a6040", tail: "#8a5a3a", top: null },
  { hair: "#1a1418", long: true, name: "Canyon", skin: "#a8704a", tail: "#9a3a2a", top: "#8a4a2a" },
  { hair: "#1a1418", long: false, name: "Marlin", skin: "#8a5434", tail: "#3a8a3a", top: "#c04a3a" },
  { hair: "#e0c070", long: false, name: "Frost", skin: "#f0d0b8", tail: "#8ab8d8", top: "#5a4a3a" },
  { hair: "#2a1c14", long: false, name: "Triton", skin: "#b07850", tail: "#3a6ab0", top: "#e8e0d0" },
];

// The order characters unlock in: the first three are open from the start,
// and each finished playthrough opens the next three.
export const unlockOrder = {
  mermaids: [0, 2, 11, 3, 8, 5, 9, 1, 6, 4, 7, 10],
  mermen: [0, 3, 10, 7, 5, 1, 8, 11, 2, 6, 9, 4],
};

export function castList(group) {
  return group === "mermen" ? mermen : mermaids;
}

let sheet = null;

// Resolves true once the cast picture has loaded, false if it could not.
export async function loadCastArt(base = "img/tidesong/") {
  if (sheet) return true;
  try {
    sheet = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
      };
      img.onerror = reject;
      img.src = `${base}merfolk-cast.webp?v=${artVersion(castAtlas)}`;
    });
    return true;
  } catch {
    sheet = null;
    return false;
  }
}

export function castArtReady() {
  return Boolean(sheet);
}

// Where a character sits in a w x h box: the whole figure always fits,
// centred, resting on the bottom.
export function castFit(group, index, w, h) {
  const r = castAtlas[group][index] ?? castAtlas[group][0];
  const scale = Math.min((w * 0.98) / r[2], (h * 0.98) / r[3]);
  const dw = r[2] * scale;
  const dh = r[3] * scale;
  return { dh, dw, r, scale, x: (w - dw) / 2, y: h - dh - h * 0.01 };
}

export function drawCast(ctx, group, index, x, y, w, h) {
  if (!sheet) return;
  const f = castFit(group, index, w, h);
  ctx.drawImage(sheet, f.r[0], f.r[1], f.r[2], f.r[3], x + f.x, y + f.y, f.dw, f.dh);
}

// The face centre, as fractions of the box: heads sit at the top middle of
// every figure; the mermaids' pictures leave more room above the face.
export function castFace(group, index, w, h) {
  const f = castFit(group, index, w, h);
  const down = group === "mermen" ? 0.085 : 0.19;
  // A finished fin makes some images wider on one side; the fifth number
  // in the atlas is then where the figure's middle really is.
  const middle = f.r[4] ?? f.r[2] / 2;
  return [f.x + middle * f.scale, f.y + f.dh * down];
}

export function castSheet() {
  return sheet;
}
