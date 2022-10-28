// 可点击浏览的 Avatar

import type { AvatarProps } from 'antd';
import { Avatar, Modal } from 'antd';
import React from 'react';
import { useState } from 'react';

type PreviewAvatarProps = AvatarProps & {
  title?: string;
};

const PreviewAvatar: React.FC<PreviewAvatarProps> = (props) => {
  const [show, setShow] = useState(false);
  return (
    <div onClick={() => setShow(!show)}>
      <Avatar {...props} />
      <Modal
        title={props.title || '大图'}
        visible={show}
        destroyOnClose
        footer={null}
        onCancel={() => setShow(false)}
        maskClosable
      >
        <img width="100%" src={props.src as string} />
      </Modal>
    </div>
  );
};

export default PreviewAvatar;
