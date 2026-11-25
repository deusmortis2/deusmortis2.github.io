// Helpers the lab tests share. A failed check throws an Error whose
// message is shown under the test, so it should say what to fix.

export function fail(message) {
  throw new Error(message);
}

// A function the lab asks for. Lab code runs as a classic script, so a
// top-level function declaration becomes a property of the window.
export function fn(t, name) {
  const found = t.win[name];
  if (typeof found !== "function") {
    fail(
      `Couldn't find ${name}(). Declare it at the top level of script.js ` +
        `with "function ${name}(...) { ... }".`,
    );
  }
  return found;
}

// True when the element exists and isn't hidden by CSS or [hidden].
export function shown(t, el) {
  if (!el || el.closest("[hidden]")) return false;
  return t.style(el).display !== "none";
}

export function sameList(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function text(el) {
  return el?.textContent.trim() ?? "";
}

// Every CSS rule in the page's stylesheets, flattened.
export function cssRules(t) {
  return [...t.doc.styleSheets].flatMap((sheet) => [...sheet.cssRules]);
}

// The resolved rgb() colour of any CSS colour value, for comparisons.
export function rgb(t, value) {
  const probe = t.doc.createElement("i");
  probe.style.color = value;
  t.doc.body.append(probe);
  const colour = t.style(probe).color;
  probe.remove();
  return colour;
}

// Clicks every element in order, letting the page react in between.
export async function clickAll(t, elements, gap = 0) {
  for (const el of elements) {
    el.click();
    // Clicks must land one after another, like a person's would.
    await t.wait(gap);
  }
}
