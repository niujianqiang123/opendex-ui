import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Cookies from 'js-cookie';
import * as CommonAction from '../redux/actions/CommonAction';
import util from '../utils/util';

function mapStateToProps(state) {
  const { privateKey } = state.Common;
  return {
    privateKey,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    commonAction: bindActionCreators(CommonAction, dispatch),
  };
}
const OKExHeaderWrapper = (Component) => {
  @connect(mapStateToProps, mapDispatchToProps)
  class CommonHeader extends React.Component {
    componentWillMount() {}
    componentDidMount() {
      console.log('OKExHeaderWrapper 1');
      this.props.commonAction.initOKChainClient();
    }

    render() {
      const lang = util.getSupportLocale(Cookies.get('locale') || 'en_US');
      return <Component {...this.props} />;
    }
  }
  return CommonHeader;
};

export default OKExHeaderWrapper;
