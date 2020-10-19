import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { toLocale } from '_src/locale/react-locale';
import util from '_src/utils/util';
import calc from '_src/utils/calc';
import { getLangURL } from '_src/utils/navigation';
import PageURL from '_constants/PageURL';
import { withRouter, Link } from 'react-router-dom';
import CoinItem from './CoinItem';
import { getCoinIcon } from './util/coinIcon';
import * as SwapAction from '_src/redux/actions/SwapAction';
import * as api from './util/api';
import Confirm from './Confirm';

function mapStateToProps(state) {
  const { baseToken, targetToken, exchangeInfo, setting } = state.SwapStore;
  const { okexchainClient } = state.Common;
  return { okexchainClient,baseToken, targetToken, exchangeInfo, setting };
}

function mapDispatchToProps(dispatch) {
  return {
    swapAction: bindActionCreators(SwapAction, dispatch)
  };
}
@withRouter
@connect(mapStateToProps, mapDispatchToProps)
export default class SwapPanel extends React.Component {
  exchange = () => {
    const { baseToken, targetToken } = this.props;
    this.props.swapAction.exchange(baseToken, targetToken);
  };

  changeBase = (token) => {
    const { baseToken } = this.props;
    this.props.swapAction.setBaseToken({ ...baseToken, ...token });
  };

  changeTarget = (token) => {
    const { targetToken } = this.props;
    this.props.swapAction.setTargetToken({ ...targetToken, ...token });
  };

  initBaseToken = async () => {
    const { baseToken } = this.props;
    const { native_token = '', tokens = [] } = await api.tokens({
      support_route: true,
    });
    const base = tokens.filter((d) => d.symbol === native_token)[0];
    if (!base) return;
    this.props.swapAction.setBaseToken({ ...baseToken, ...base });
  };

  loadBaseCoinList = async () => {
    const { tokens = [] } = await api.tokens({ support_route: true });
    const {targetToken} = this.props;
    if(!targetToken.symbol) return tokens;
    return tokens.filter(d => d.symbol !== targetToken.symbol);
  };

  loadTargetCoinList = async () => {
    const {
      baseToken: { symbol },
    } = this.props;
    const { tokens = [] } = await api.tokens({ symbol, support_route: true });
    return tokens.filter(d => d.symbol !== symbol);
  };

  revert = () => {
    this.props.swapAction.revertPrice();
  };

  revert = () => {
    this.props.swapAction.revertPrice();
  };

  componentDidMount() {
    this.initBaseToken();
  }

  getExchangeInfo() {
    const { baseToken, targetToken, exchangeInfo } = this.props;
    if (baseToken.symbol && targetToken.symbol) {
      if (!baseToken.value || !targetToken.value) {
        return (
          <div className="coin-exchange-detail">
            <div className="info">
              <div className="info-name">{toLocale('Price')}</div>
              <div className="info-value">
                <i className="exchange" />1{baseToken.symbol} ≈ -
                {targetToken.symbol}
              </div>
            </div>
          </div>
        );
      } else {
        let priceInfo = `1${baseToken.symbol} ≈ ${exchangeInfo.price}${targetToken.symbol}`;
        if (exchangeInfo.isReverse)
          priceInfo = `1${targetToken.symbol} ≈ ${calc.div(
            1,
            exchangeInfo.price
          )}${baseToken.symbol}`;
        return (
          <div className="coin-exchange-detail">
            <div className="info">
              <div className="info-name">{toLocale('Price')}</div>
              <div className="info-value">
                <i className="exchange" onClick={this.revert} />
                {priceInfo}
                <i />
              </div>
            </div>
            <div className="info">
              <div className="info-name">
                {toLocale('Minimum received')}
                <i className="help" title={toLocale('Minimum received help')} />
              </div>
              <div className="info-value">
                {this.getMinimumReceived()} {targetToken.symbol}
              </div>
            </div>
            <div className="info">
              <div className="info-name">
                {toLocale('Price Impact')}
                <i className="help" title={toLocale('Price Impact help')} />
              </div>
              <div className="info-value">{exchangeInfo.price_impact}%</div>
            </div>
            <div className="info">
              <div className="info-name">
                {toLocale('Liquidity Provider Fee')}
                <i
                  className="help"
                  title={toLocale('Liquidity Provider Fee help')}
                />
              </div>
              <div className="info-value">
                {exchangeInfo.fee} {baseToken.symbol}
              </div>
            </div>
            {exchangeInfo.route && (
              <div className="info">
                <div className="info-name">
                  {toLocale('Route')}
                  <i className="help" />
                </div>
                <div className="info-value">
                  <img className="coin" src={getCoinIcon(baseToken.symbol)} />
                  {baseToken.symbol} &gt;{' '}
                  <img className="coin" src={getCoinIcon(exchangeInfo.route)} />
                  {exchangeInfo.route} &gt;
                  <img className="coin" src={getCoinIcon(targetToken.symbol)} />
                  {targetToken.symbol}
                </div>
              </div>
            )}
          </div>
        );
      }
    }
    return null;
  }

  getMinimumReceived() {
    const {
      targetToken,
      setting: { slippageTolerance },
    } = this.props;
    return util.precisionInput(calc.mul(targetToken.value, 1 - slippageTolerance * 0.01));
  }

  getBtn() {
    const { baseToken, targetToken } = this.props;
    let btn;
    if (!util.isLogined()) {
      btn = (
        <Link to={getLangURL(PageURL.walletCreate)}>
          <div className="btn">{toLocale('Connect Wallet')}</div>
        </Link>
      );
    } else if (!baseToken.symbol || !targetToken.symbol) {
      btn = <div className="btn disabled">{toLocale('Invalid Pair')}</div>;
    } else if (!baseToken.value || !targetToken.value) {
      btn = <div className="btn disabled">{toLocale('Input an amount')}</div>;
    } else {
      btn = (
        <Confirm onClick={this.confirm} loadingTxt={toLocale('pending transactions')} successTxt={toLocale('transaction confirmed')}>
          <div className="btn">
            {toLocale('Confirm')}
          </div>
        </Confirm>
      );
    }
    return <div className="btn-wrap">{btn}</div>;
  }

  confirm = () => {
    const { baseToken,targetToken,okexchainClient } = this.props;
    const params = {
      sell_amount: `${baseToken.value}${baseToken.symbol}`,
      min_buy_amount: `${this.getMinimumReceived()}${targetToken.symbol}`,
      quote_token: targetToken.symbol,
      deadline: Date.now() + 1000000,
    };
    console.log(params);
    return okexchainClient.sendSwapTokenTransaction(baseToken.value, baseToken.symbol, this.getMinimumReceived(), targetToken.symbol, Date.now() + 1000000, util.getMyAddr(), '', null)
  };

  render() {
    const { baseToken, targetToken } = this.props;
    const exchangeInfo = this.getExchangeInfo();
    const btn = this.getBtn();
    return (
      <div className="panel panel-swap">
        <CoinItem
          label={toLocale('From')}
          token={baseToken}
          onChange={this.changeBase}
          loadCoinList={this.loadBaseCoinList}
        />
        <div className="sep transformation-sep">
          <i onClick={this.exchange} />
        </div>
        <CoinItem
          label={toLocale('To(estimated)')}
          disabled={true}
          token={targetToken}
          onChange={this.changeTarget}
          loadCoinList={this.loadTargetCoinList}
        />
        {exchangeInfo}
        {btn}
      </div>
    );
  }
}