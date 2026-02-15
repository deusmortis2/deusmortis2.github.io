'use strict';
const projectStatus = {
  PENDING: {
    description: "Pending Execution"},
  SUCCESS: {
    description: "Executed Successfully"
  },
  FAILURE: {
    description: "Execution Failed"},
}

class ProjectIdea {
  constructor(title, description) {
    this.title = title;
    this.description = description;
    this.status = projectStatus.PENDING;
  }
  updateProjectStatus (newStatus) {
    this.status = newStatus;
  }
  toString() {
    return `${this.title} (${this.status.description}) - ${this.description}\n`;
  }
};

class ProjectIdeaBoard {
  constructor(title) {
    this.title = title;
    this.ideas = [];
  }

  pin (projectIdea) {
    this.ideas.push(projectIdea);
  }

  unpin () {
    this.ideas.pop();

  }

  count () {
    return this.ideas.length;
  }

  formatToString() {
    const count = this.count();
    if (count === 0) {
      return `${this.title} has 0 idea(s)\n`;
    }
    const projectIdeas = this.ideas.map((idea) => idea.toString()).join('');
    return `${this.title} has ${count} idea(s)\n${projectIdeas}`
  }
}



