

export class ACME {
  constructor({ service }) {
    this.service = service;
  }
  async getDirectory() {
    const res = await fetch(`${this.service}/directory`);
    const data = await res.json();
    return data;
  }
  getResourceUrl(name) {
    return this.config[name];
  }
}