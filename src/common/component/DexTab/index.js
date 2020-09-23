import React from 'react';
import { toLocale } from '_src/locale/react-locale'
import './index.less';

const index = ({ tabs = [], current, onChangeTab, optional = null }) => {
  return (
    <div className="dex-tab">
      {tabs.map(({ id, label }) => {
        return (
          <div
            key={id}
            className={`dex-tab-item${current === id ? ' current' : ''}`}
            onClick={onChangeTab(id)}
          >
            {toLocale(label)}
          </div>
        );
      })}
      {optional}
    </div>
  );
};

export default index;