import { ACME } from '../index.js';

(async () => {

    const acme = new ACME({
        service: 'https://acme-staging-v02.api.letsencrypt.org'
    });
    acme.config = await acme.getDirectory();
    const account = await acme.createAccount();
    const order = await acme.createOrder();
})();