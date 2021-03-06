import { crypto } from '@okchain/javascript-sdk';

const walletUtil = {
  // sessionStroage中存入user信息
  setUserInSessionStroage(privateKey, keyStore) {
    const addr = crypto.getAddressFromPrivateKey(privateKey);
    const user = {
      addr,
      info: keyStore
    };
    window.localStorage.setItem('dex_user', JSON.stringify(user));
    window.OK_GLOBAL.senderAddr = addr;
    window.OK_GLOBAL.isLogin = true;
  },
  // 密码框type
  getPasswordInputType() {
    return window.navigator.userAgent.match(/webkit/i) ? 'text' : 'password';
  }
};
export default walletUtil;

