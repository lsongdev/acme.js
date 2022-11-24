import { ACME } from '../index.js';

const accountKey = `
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgA8aaCjB1AlV2ndWt
y/1mBDxzEZdvXymT/aBCXw1E26KhRANCAASv8qR9xkSTsOHGBB8F1OEPYQ4gmst1
k3JMM1Bg/XKlyNfynRX+WfB6VtQaiPllh5qazOgX3xfOeNcQQIqzQeVU
-----END PRIVATE KEY-----
`;

(async () => {

  const acme = new ACME({
    accountKey,
    accountUrl: 'https://acme-staging-v02.api.letsencrypt.org/acme/acct/77262414',
    directoryUrl: `https://acme-staging-v02.api.letsencrypt.org/directory`,
  });

  // const account = await acme.createAccount({
  //   contact: [
  //     "mailto: song940@gmail.com"
  //   ],
  //   termsOfServiceAgreed: true
  // });
  // console.log(account);
  // acme.accountKey = account.key;
  // const order = await acme.createOrder({
  //   identifiers: [
  //     {
  //       type: "dns",
  //       value: "lsong.org",
  //     }
  //   ]
  // });
  // const order = await acme.getOrder({
  //   url: `https://acme-staging-v02.api.letsencrypt.org/acme/order/77262414/5404155544`
  // });
  // console.log(order);
  // const authz =  await acme.getAuthorizations(order);
  // console.log(authz[0]);
  // const challenge = await acme.completeChallenge(authz[0].challenges[0]);
  // console.log(challenge);
  // const key = await acme.getChallengeKey(challenge);
  // console.log(key);
})();