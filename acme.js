import assert from 'assert';
import { createHash } from 'crypto';
import { Base } from './base.js';

export class ACME extends Base {
  constructor({ directoryUrl, accountKey, accountUrl }) {
    super();
    this.directoryUrl = directoryUrl;
    this.accountUrl = accountUrl;
    this.accountKey = Buffer.from(accountKey);

  }
  async request(url, init = {}) {
    init.headers = init.headers || {};
    const { method = 'POST' } = init;
    if (method.toUpperCase() === 'POST') {
      const nonce = await this.getNonce();
      const kid = init.includeKid ? await this.getAccountUrl() : undefined;
      const data = this.buildSignedRequestData(url, init.payload, { nonce, kid });
      init.body = JSON.stringify(data);
      init.headers["Content-Type"] = 'application/jose+json';
    }
    const res = await fetch(url, { method, ...init });
    this.nonce = res.headers.get("replay-nonce");
    return res;
  }
  async requestResource(resource, init) {
    const url = await this.getResourceUrl(resource);
    return this.request(url, init);
  }
  async getDirectory() {
    const res = await fetch(this.directoryUrl);
    const data = await res.json();
    this.directory = data;
  }
  async getResourceUrl(resource) {
    if (!this.directory) await this.getDirectory();
    return this.directory[resource];
  }
  async getNonce({ force } = {}) {
    if (!force && this.nonce) return this.nonce;
    const url = await this.getResourceUrl('newNonce');
    const res = await this.request(url, { method: 'HEAD' });
    assert.equal(res.status, 200);
    return this.nonce;
  }
  async getAccountUrl() {
    if (this.accountUrl) return this.accountUrl;
    throw new Error('No account URL found, register account first');
  }
  async createAccount(payload) {
    assert.ok(payload.contact);
    assert.ok(payload.termsOfServiceAgreed);
    const res = await this.requestResource('newAccount', { payload });
    const result = await res.json();
    assert.equal(res.status, 200, result.detail);
    result.url = res.headers.get("location");
    return result;
  }
  async createOrder(payload) {
    if (!payload.identifiers) {
      throw new Error('Unable create order, `identifiers` not found');
    }
    const res = await this.requestResource('newOrder', { payload, includeKid: true });
    const result = await res.json();
    assert.equal(res.status, 201, result.detail);
    result.url = res.headers.get("location");
    return result;
  }
  async getOrder(order) {
    if (!order.url)
      throw new Error('Unable to get order, order.url not found');
    const res = await this.request(order.url, { includeKid: true });
    const result = await res.json();
    assert.equal(res.status, 200, result.detail);
    result.url = order.url;
    return result;
  }
  async finalizeOrder(order, csr) {
    if (!order.finalize)
      throw new Error('Unable to finalize order, URL not found');

    if (!Buffer.isBuffer(csr)) csr = Buffer.from(csr);

    const payload = { csr };
    const res = await this.request(order.finalize, { includeKid: true, payload });
    const result = await res.json();
    assert.equal(res.status, 200, result.detail);
    result.url = order.url;
    return result;
  }
  async getAuthorizations(order) {
    return await Promise.all((order.authorizations || []).map(async (url) => {
      const res = await this.request(url, { includeKid: true });
      const data = await res.json();
      data.url = url;
      return data;
    }));
  }
  deactivateAuthorization(authz) {
    if (!authz.url) throw new Error('Unable to deactivate identifier authorization, URL not found');
    const payload = {
      status: 'deactivated'
    };
    return this.request(authz.url, { payload, includeKid: true });
  }
  async getChallengeKey(challenge) {
    const jwk = this.getJwk();
    const keysum = createHash('sha256').update(JSON.stringify(jwk));
    const thumbprint = keysum.digest('base64url');
    const result = `${challenge.token}.${thumbprint}`;

    /**
     * https://tools.ietf.org/html/rfc8555#section-8.3
     */
    if (challenge.type === 'http-01') {
      return result;
    }

    /**
     * https://tools.ietf.org/html/rfc8555#section-8.4
     * https://tools.ietf.org/html/draft-ietf-acme-tls-alpn-01
     */
    if ((challenge.type === 'dns-01') || (challenge.type === 'tls-alpn-01')) {
      const shasum = createHash('sha256').update(result);
      return shasum.digest('base64url');
    }
    throw new Error(`Unable to produce key authorization, unknown challenge type: ${challenge.type}`);
  }
  async completeChallenge(challenge) {
    const res = await this.request(challenge.url, { includeKid: true });
    const result = await res.json();
    assert.equal(res.status, 200, result.detail);
    return result;
  }
  async revokeCert(payload) {
    const res = await this.request(challenge.url, { payload, includeKid: true });
    const result = await res.json();
    assert.equal(res.status, 200, result.detail);
    return result;
  }
}