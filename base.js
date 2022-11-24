import assert from 'assert';
import { createPublicKey, createSign, constants } from 'crypto';

const { RSA_PKCS1_PADDING } = constants;

export const objToBase64URL = obj => {
  const json = JSON.stringify(obj);
  const data = Buffer.from(json);
  return data.toString('base64url');
};

export const genJwk = key => {
  const jwk = createPublicKey(key).export({
    format: 'jwk'
  });
  return Object.keys(jwk).sort().reduce((result, k) => {
    result[k] = jwk[k];
    return result;
  }, {});
};

export class Base {
  getJwk() {
    if (this.jwk) return this.jwk;
    return this.jkw = genJwk(this.accountKey);
  }
  buildRequestData(header, payload) {
    assert.ok(header.url);
    assert.ok(header.alg);
    /* KID or JWK */
    if (!header.kid) {
      header.jwk = this.getJwk();
    }
    return {
      protected: objToBase64URL(header),
      payload: payload ? objToBase64URL(payload) : ''
    };
  }
  buildSignedRequestData(url, payload, { nonce, kid } = {}) {
    const jwk = this.getJwk();
    let headerAlg;
    let signerAlg;
    /* https://datatracker.ietf.org/doc/html/rfc7518#section-3.1 */
    if (jwk.kty === 'EC') {
      switch (jwk.crv) {
        case 'P-256':
          headerAlg = 'ES256';
          signerAlg = 'SHA256';
          break;
        case 'P-384':
          headerAlg = 'ES384';
          signerAlg = 'SHA384';
          break;
        case 'P-521':
          headerAlg = 'ES512';
          signerAlg = 'SHA512';
          break;
        default:
          headerAlg = 'ES256';
          signerAlg = 'SHA256';
          break;
      }
    } else {
      headerAlg = 'RS256';
      signerAlg = 'SHA256';
    }
    const header = { alg: headerAlg, url, nonce, kid };
    const data = this.buildRequestData(header, payload);
    const str = `${data.protected}.${data.payload}`;
    const signer = createSign(signerAlg).update(str, 'utf8');
    /* Signature - https://stackoverflow.com/questions/39554165 */
    data.signature = signer.sign({
      key: this.accountKey,
      padding: RSA_PKCS1_PADDING,
      dsaEncoding: 'ieee-p1363'
    }, 'base64url');
    return data;
  }
}