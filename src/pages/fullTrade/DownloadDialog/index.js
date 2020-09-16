import React from 'react';
import { Dialog } from '_component/Dialog';
import { Circle } from 'rc-progress';
import { calc } from '_component/okit';
import Icon from '_component/IconLite';

import './index.less';

const electronUtils = window.require('electron').remote.require('./src/utils');
const { emitter, store } = electronUtils;
let dialog;

const Process = ({ percent = 0, text }) => (
  <div className="status">
    <div className="progress">
      <div className="percent-text">{percent}%</div>
      <Circle percent={percent} strokeWidth="6" trailWidth="6" strokeColor="#2EAD65" /> 
    </div>
    {text}
  </div>
);

const DownResult = ({ icon, text }) => (
  <div className="success">
    <div className="icon">
      <Icon className={icon} isColor />
    </div>
    {text}
  </div>
);
const dialogConfigCommon = {
  install: {
    className: 'download-dialog',
    cancelText: 'Cancel',
    hideCloseBtn: false
  },
  downloading: {
    className: 'status-dialog',
    title: undefined,
    cancelText: undefined,
    confirmText: undefined,
    hideCloseBtn: true
  },
  success: {
    className: 'success-dialog',
    title: undefined,
    cancelText: undefined,
    confirmText: 'GO Checked',
  },
  fail: {
    className: 'fail-dialog',
    title: undefined,
    cancelText: 'Cancel',
    confirmText: 'Try Again',
  }
};

const dialogConfig = {
  install: {
    install: {
      ...dialogConfigCommon.install,
      title: 'Install Local node',
      children: (
        <div className="install">
          <p>Now you could install your own OKExChain node locally.</p>
          <p>Hardware requirement: CPU 4 core</p>
        </div>
      ),
      confirmText: 'Install',
    },
    downloading: {
      ...dialogConfigCommon.downloading,
      children: <Process percent={0} text="Installing..." />
    },
    success: {
      ...dialogConfigCommon.success,
      children: <DownResult icon="icon-icon_success" text="Installed successfully" />
    },
    fail: {
      ...dialogConfigCommon.fail,
      children: <DownResult icon="icon-icon_fail" text="Installed failed." />
    }
  },
  update: {
    install: {
      ...dialogConfigCommon.install,
      title: 'Local node upgrade notice',
      children: (v) => (
        <div className="install">
          <p>You local node is outdated, please update to the latest version {v}</p>
        </div>
      ),
      confirmText: 'Upgrade',
    },
    downloading: {
      ...dialogConfigCommon.downloading,
      children: <Process percent={0} text="Updating..." />
    },
    success: {
      ...dialogConfigCommon.success,
      children: <DownResult icon="icon-icon_success" text="Updated successfully！" />
    },
    fail: {
      ...dialogConfigCommon.fail,
      children: <DownResult icon="icon-icon_fail" text="Updated failed." />
    }
  }
}

let isEmitterInit = false;

const onDownloadAndUpdate = () => {
  let option;
  let isFinish = false;
  let config = {};
  let isInstall = true;
  const okchaindObj = store.get('okchaindObj');
  const cliObj = store.get('cliObj');
  const processTotal = okchaindObj.size + cliObj.size; // 2 assets will be download
  const transferredBytesMap = {
    okchaind: 0,
    okchaincli: 0
  };

  const updateDialog = (option) => {
    if (dialog) {
      dialog.update(option);
    } else {
      dialog = Dialog.show(option);
    }
  };

  const setInstallDialog = (type, version) => {
    option = config.install;
    option.onConfirm = () => {
      setDownloadingDialog('okchaind');
      emitter.emit('downloadOkchaind@download'); // trigger okchaind download
    }
    if (type === 'update') {
      option.children = option.children(version);
    }
    updateDialog(option);
  }

  const setDownloadingDialog = (name = 'okchaind', transferredBytes) => {
    option = config.downloading;
    const updateProcessDialog = () => {
      transferredBytesMap[name] = transferredBytes;
      const { okchaind = 0, okchaincli = 0 } = transferredBytesMap;
      const ratio = calc.div(okchaind + okchaincli, processTotal);

      const percent = calc.truncate(ratio * 100, 1);
      option.children = <Process percent={percent} text={isInstall ? 'Installing...' : 'Updating...'} />
      updateDialog(option);
    };

    updateProcessDialog();
  }

  const setSuceesDialog = () => {
    isFinish = true;
    option = config.success;
    option.onConfirm = () => dialog.destroy();
    updateDialog(option);
  }

  const setFailDialog = () => {
    isFinish = true;
    option = config.fail;
    option.onConfirm = () => {
      isFinish = false;
      // reset download process
      transferredBytesMap.okchaind = 0;
      transferredBytesMap.okchaincli = 0;

      emitter.emit('redownload');
      emitter.emit('downloadOkchaind@download'); // trigger okchaind download
    };
    updateDialog(option);
  }

  const initEmitter = () => {
    if (!isEmitterInit) {
      emitter.on('notDownload@Download', data => {
        isInstall = true;
        config = dialogConfig.install;
        if(data.isRedownload) {
          setDownloadingDialog();
        } else {
          setInstallDialog('install');
        }
      });

      emitter.on('newVersionFound@download', data => {
        isInstall = false;
        config = dialogConfig.update;
        if(data.isRedownload) {
          setDownloadingDialog();
        } else {
          setInstallDialog('update', data.tagName);
        }
      })

      emitter.on('downloadProgress@okchaind', data => {
        setDownloadingDialog('okchaind', data.transferredBytes || 0);
      });
  
      emitter.on('downloadProgress@okchaincli', data => {
        if (!isFinish) {
          setDownloadingDialog('okchaincli', data.transferredBytes || 0);
        }
      })
  
      emitter.on('downloadFinish@okchaind', () => {
        emitter.emit('downloadOkchaincli@download'); // electron-dl bug on process, can not parallel download
      });
      
      emitter.on('downloadFinish@okchaincli', () => {
        setSuceesDialog();
      });
  
      emitter.on('downloadError', () => {
        setFailDialog();
      });

      emitter.emit('windowReadyReceiveEvent'); // maybe github latest api so fast.

      isEmitterInit = true;
    }
  };

  initEmitter();
}

const downloadDialog = () => {
  if (!isEmitterInit) {
    onDownloadAndUpdate();
  }
  return dialog;
}

export default downloadDialog;