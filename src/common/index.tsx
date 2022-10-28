// 开放入口

import { KeyOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import React from 'react';

export const route = [
  {
    name: 'rootSystem',
    icon: 'setting',
    path: '/rootSystem',
    authority: ['ROOT'],
    component: '@/common/pages/RootSystem',
  },
  {
    name: 'changePassword',
    path: '/account/changePassword',
    hideInMenu: true,
    component: '@/common/pages/ChangePassword',
  },
];

export const menu = (
  <>
    <Menu.Item key="changePassword">
      <KeyOutlined />
      修改密码
    </Menu.Item>
    <Menu.Divider />
  </>
);
