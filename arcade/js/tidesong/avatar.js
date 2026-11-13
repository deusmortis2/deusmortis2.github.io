// The player's character: a mermaid or merman picked from the cast
// (cast.js), plus a name. There is nothing else to customise.
import { castList, mermaids, mermen } from "./cast.js";

export const bodies = [
  { group: "mermaids", id: "female", label: "Mermaid", plural: "Mermaids" },
  { group: "mermen", id: "male", label: "Merman", plural: "Mermen" },
];

export function groupOf(avatar) {
  return bodies[avatar.body]?.group ?? "mermaids";
}

export function castMember(avatar) {
  const list = castList(groupOf(avatar));
  return list[avatar.look] ?? list[0];
}

export function defaultAvatar() {
  return { body: 0, look: 0, name: mermaids[0].name };
}

// Colours the small swimming sprite and the HUD use.
export function avatarColors(avatar) {
  const member = castMember(avatar);
  return {
    fin: member.tail,
    hair: member.hair,
    skin: member.skin,
    tail: member.tail,
    top: member.top,
  };
}

// Saves from before the cast (or hand-edited ones) might hold anything:
// keep only a valid body, character and name.
export function sanitiseAvatar(raw) {
  const body = raw?.body === 1 ? 1 : 0;
  const list = body === 1 ? mermen : mermaids;
  const look = Number(raw?.look);
  const avatar = {
    body,
    look: Number.isInteger(look) && look >= 0 && look < list.length ? look : 0,
    name: "",
  };
  avatar.name = String(raw?.name ?? "").trim().slice(0, 14) || list[avatar.look].name;
  return avatar;
}
