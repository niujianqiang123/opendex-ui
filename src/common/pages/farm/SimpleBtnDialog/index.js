
import React from 'react';
import { Dialog } from '../../../component/Dialog';

export default class SimpleBtnDialog extends React.Component {

  constructor() {
    super();
    this.state = {
      show: false
    };
  }

  onClose = () => {
    this.setState({show:false});
  }

  createBtn() {
    const { children,disabled } = this.props;
    const child = React.Children.only(children);
    const {onClick} = child.props;
    return React.cloneElement(child, {
      onClick: async () => {
        if(disabled || (onClick && await onClick() === false)) return;
        this.onClick()
      },
    });
  }

  onClick = () => {
    this.setState({show:true});
  }

  render() {
    const {show} = this.state;
    const Component = React.cloneElement(this.props.component,{onClose:this.onClose});
    return (
      <>
      {show && <Dialog visible>{Component}</Dialog>}
      {this.createBtn()}
      </>
      );
  }
}


