// Free-play build: there are no questions. Every game still calls these,
// and each "question" counts as answered right straight away.
export async function loadQuestions() {
  return [];
}

export async function askQuestion() {
  return true;
}
