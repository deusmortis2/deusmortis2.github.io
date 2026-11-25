// A very small syntax highlighter for the lesson code blocks. It only
// colours comments, strings, keywords and HTML tag names, which is enough
// to make the samples easier to scan.
const patterns = {
  css: /(\/\*[\s\S]*?\*\/)|("[^"\n]*")|(@[\w-]+)/g,
  html: /(<!--[\s\S]*?-->)|("[^"\n]*")|(<\/?[a-zA-Z][\w-]*|\/?>)/g,
  js: new RegExp(
    [
      "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)",
      "(\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'|`(?:\\\\.|[^`\\\\])*`)",
      "\\b(const|let|function|return|if|else|async|await|import|export|from|" +
        "for|new|try|catch|finally|of|while|null|true|false|undefined)\\b",
    ].join("|"),
    "g",
  ),
};

const classes = ["cm", "st", "kw"];

export function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function highlight(text, lang) {
  if (lang === "text") return escapeHtml(text);
  const pattern = patterns[lang] ?? patterns.js;
  let out = "";
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    out += escapeHtml(text.slice(last, match.index));
    const group = match.slice(1).findIndex((g) => g !== undefined);
    const cls = lang === "html" && group === 2 ? "tg" : classes[group];
    out += `<span class="${cls}">${escapeHtml(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  return out + escapeHtml(text.slice(last));
}
