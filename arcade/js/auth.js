// Free-play build: everyone plays as a guest and nothing is saved.
const session = { guest: true, teacher: false, username: "guest" };

export function getSession() {
  return session;
}

export function requireSession() {
  return session;
}
