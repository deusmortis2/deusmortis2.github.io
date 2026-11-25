// Lab: sticky notes kept in localStorage and synced with a pretend cloud
// copy, practising Tidesong's save slots: savedAt stamps, the newest copy
// wins, and tombstones so deleted notes stay deleted.
import { fn } from "./checks.js";

const prefix = "stickyNotes:";

function clearNotes() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage blocked: the tests will say so.
  }
}

function stored(id) {
  try {
    return JSON.parse(localStorage.getItem(prefix + id));
  } catch {
    return "not JSON";
  }
}

// Compares plain objects, ignoring the order of their keys.
function same(a, b) {
  const sorted = (o) => {
    if (!o || typeof o !== "object") return JSON.stringify(o);
    return JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
  };
  return sorted(a) === sorted(b);
}

export default {
  beforeEach: clearNotes,
  firstTab: "js",
  intro: `
    <p>A sticky-notes app keeps each note in <code>localStorage</code>, and
    a copy of each in the cloud so notes follow you between computers.
    There's no real cloud here: the tests hand you the cloud's copy as an
    object.</p>
    <p>Do it the way Tidesong syncs save slots. Every copy carries a
    <code>savedAt</code> time and <strong>the newest copy wins</strong>.
    Deleting a note leaves a <strong>tombstone</strong> recording when it
    was deleted, so an older copy can't bring it back. A copy is always
    <code>{ text, savedAt }</code>, with <code>text</code> as
    <code>""</code> for a deleted note. Write each function as a top-level
    function declaration.</p>`,
  starter: {
    css: "",
    html: `<h1>Sticky Notes</h1>
<p>Bonus: a textarea and Save and Delete buttons for note "shopping".</p>
`,
    js: `// Each note lives in localStorage under "stickyNotes:" + its id.
function noteKey(id) {
  return "stickyNotes:" + id;
}

function saveNote(id, text, now = Date.now()) {
}

function deleteNote(id, now = Date.now()) {
}

function readNote(id) {
}

function newest(local, cloud) {
}

function syncNote(id, cloud) {
}
`,
  },
  stories: [
    "<code>saveNote(id, text, now)</code> stores <code>{ text, savedAt: now }</code> as JSON under <code>noteKey(id)</code>.",
    "<code>deleteNote(id, now)</code> stores a tombstone, <code>{ deletedAt: now }</code>, under the same key.",
    "<code>readNote(id)</code> returns the stored copy as <code>{ text, savedAt }</code>, or <code>{ text: \"\", savedAt: deletedAt }</code> for a tombstone. With nothing stored, or text that isn't valid JSON, it returns <code>null</code> (it must not throw).",
    "<code>newest(local, cloud)</code> returns <code>\"local\"</code>, <code>\"cloud\"</code> or <code>\"same\"</code> by comparing <code>savedAt</code>. A missing copy (<code>null</code>) counts as -1, older than anything.",
    "<code>syncNote(id, cloud)</code> compares <code>readNote(id)</code> with <code>cloud</code>. If the cloud is newer it stores the cloud's copy here (as a tombstone if its text is <code>\"\"</code>) and returns <code>\"pulled\"</code>. If this browser's is newer it returns <code>\"push\"</code>. Otherwise <code>\"same\"</code>.",
  ],
  tests: [
    {
      run: (t) => {
        fn(t, "saveNote")("shopping", "Milk, eggs", 100);
        return same(stored("shopping"), { text: "Milk, eggs", savedAt: 100 });
      },
      text: "<code>saveNote</code> stores <code>{ text, savedAt }</code> as JSON under <code>stickyNotes:&lt;id&gt;</code>.",
    },
    {
      run: (t) => {
        fn(t, "saveNote")("shopping", "Milk", 100);
        fn(t, "deleteNote")("shopping", 250);
        return same(stored("shopping"), { deletedAt: 250 });
      },
      text: "<code>deleteNote</code> replaces the note with a <code>{ deletedAt }</code> tombstone.",
    },
    {
      run: (t) => {
        const readNote = fn(t, "readNote");
        fn(t, "saveNote")("a", "Hello", 5);
        fn(t, "deleteNote")("b", 9);
        return (
          same(readNote("a"), { text: "Hello", savedAt: 5 }) &&
          same(readNote("b"), { text: "", savedAt: 9 })
        );
      },
      text: "<code>readNote</code> gives <code>{ text, savedAt }</code>, with empty text for a tombstone.",
    },
    {
      run: (t) => {
        localStorage.setItem(prefix + "broken", "{oops");
        const readNote = fn(t, "readNote");
        return readNote("nothing") === null && readNote("broken") === null;
      },
      text: "<code>readNote</code> returns <code>null</code> for a missing note or broken JSON.",
    },
    {
      run: (t) => {
        const newest = fn(t, "newest");
        const at = (savedAt) => ({ savedAt, text: "x" });
        return (
          newest(at(5), at(3)) === "local" &&
          newest(at(3), at(5)) === "cloud" &&
          newest(at(4), at(4)) === "same" &&
          newest(null, at(0)) === "cloud" &&
          newest(at(0), null) === "local" &&
          newest(null, null) === "same"
        );
      },
      text: "<code>newest</code> compares <code>savedAt</code>, counting a missing copy as -1.",
    },
    {
      run: (t) => {
        fn(t, "saveNote")("todo", "Old", 100);
        const result = fn(t, "syncNote")("todo", { savedAt: 200, text: "New" });
        return result === "pulled" && same(fn(t, "readNote")("todo"), { text: "New", savedAt: 200 });
      },
      text: "A newer cloud copy is pulled into this browser.",
    },
    {
      run: (t) => {
        fn(t, "saveNote")("todo", "Mine", 300);
        const result = fn(t, "syncNote")("todo", { savedAt: 200, text: "Theirs" });
        const pushNull = fn(t, "syncNote")("todo", null);
        return result === "push" && pushNull === "push" &&
          same(fn(t, "readNote")("todo"), { text: "Mine", savedAt: 300 });
      },
      text: "A newer local copy (or no cloud copy at all) is left alone and reported as <code>\"push\"</code>.",
    },
    {
      run: (t) => {
        fn(t, "deleteNote")("todo", 500);
        const result = fn(t, "syncNote")("todo", { savedAt: 400, text: "Back from the dead?" });
        return result === "push" && same(stored("todo"), { deletedAt: 500 });
      },
      text: "A tombstone beats an older cloud copy: the deleted note stays deleted.",
    },
    {
      run: (t) => {
        fn(t, "saveNote")("todo", "Mine", 100);
        const result = fn(t, "syncNote")("todo", { savedAt: 600, text: "" });
        return result === "pulled" && same(stored("todo"), { deletedAt: 600 });
      },
      text: "A newer cloud tombstone deletes the note here, stored as a tombstone.",
    },
  ],
  title: "Sticky Notes Sync",
};
