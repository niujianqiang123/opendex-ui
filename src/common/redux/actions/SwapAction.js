import SwapActionType from '../actionTypes/SwapActionType';
import * as api from '../../pages/swap/util/api';

export function setting(data) {
  return (dispatch) => {
    dispatch({
      type: SwapActionType.SETTING,
      data,
    });
  };
}

export function hasSetting(data) {
  return (dispatch) => {
    dispatch({
      type: SwapActionType.SETTING_ICON,
      data,
    });
  };
}

export function exchange(baseToken, targetToken) {
  return async (dispatch, getState) => {
    const data = {
      ...getState().SwapStore,
      baseToken: targetToken,
      targetToken: baseToken,
    };
    data.targetToken.value = '';
    await updateSwapInfo(data, 'baseToken');
    dispatch({
      type: SwapActionType.ALL,
      data,
    });
  };
}

async function updateSwapInfo(data, key) {
  const { value, symbol } = data[key];
  const target = key === 'baseToken' ? data.targetToken : data.baseToken;
  if (value && symbol && target.symbol) {
    const { buy_amount, price, price_impact, fee, route } = await api.buyInfo({
      amount_to_sell: `${value}${symbol}`,
      token_to_buy: target.symbol,
    });
    data.exchangeInfo = { price, price_impact, fee, route };
    target.value = buy_amount;
  } else {
    target.value = '';
  }
}

export function setBaseToken(baseToken) {
  return async (dispatch, getState) => {
    const data = { ...getState().SwapStore, baseToken };
    updateSwapInfo4RealTime(dispatch,data,'baseToken');
  };
}

export function setTargetToken(targetToken) {
  return async (dispatch, getState) => {
    const data = { ...getState().SwapStore, targetToken };
    updateSwapInfo4RealTime(dispatch,data,'baseToken');
  };
}

async function _updateSwapInfo(dispatch,data,key) {
  await updateSwapInfo(data, key);
  dispatch({
    type: SwapActionType.ALL,
    data,
  });
}

function updateSwapInfo4RealTime(dispatch,data,key,time=3000) {
  if(updateSwapInfo4RealTime.interval) {
    clearInterval(updateSwapInfo4RealTime.interval);
    updateSwapInfo4RealTime.interval = null;
  }
  _updateSwapInfo(dispatch,data,key);
  updateSwapInfo4RealTime.interval = setInterval(function() {
    _updateSwapInfo(dispatch,data,key);
  },time);
}

export function revertPrice() {
  return (dispatch, getState) => {
    const { exchangeInfo } = getState().SwapStore;
    exchangeInfo.isReverse = !exchangeInfo.isReverse;
    dispatch({
      type: SwapActionType.ALL,
      data: { exchangeInfo: { ...exchangeInfo } },
    });
  };
}