import React, { useRef } from 'react';
import { Form, Input, Button, message } from 'antd';
import type { FormInstance } from 'antd/lib/form';
import { ProCard } from '@ant-design/pro-card';

const layout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 10,
  },
};
const tailLayout = {
  wrapperCol: {
    offset: 8,
    span: 16,
  },
};

interface ChangePasswordProps {
  /**
   * 完成修改密码的请求
   */
  handler: (data: ChangePasswordRequest) => Promise<any | void>;
}

interface ChangePasswordRequest {
  password: string;
  newPassword: string;
}

const ChangePasswordForm: React.FC<ChangePasswordProps> = ({ handler }) => {
  const formRef = useRef<FormInstance>();

  const handleChange = async (fields: ChangePasswordRequest) => {
    const hide = message.loading('修改中……');
    try {
      await handler(fields);
      // await changePasswordUsingPOST({}, fields);
      // await request('/api/passwordChanger', {
      //   method: 'POST',
      //   data: fields,
      // });
      hide();
      message.success('修改成功');
    } catch (e) {
      hide();
      message.error('修改失败');
    }
  };

  return (
    <ProCard>
      <Form<ChangePasswordRequest>
        onFinish={handleChange}
        ref={(f) => {
          formRef.current = f!!;
        }}
        {...layout}
      >
        <Form.Item
          label="原密码"
          name="password"
          rules={[
            {
              required: true,
              message: '请输入有效的原密码',
            },
          ]}
        >
          <Input type="password" />
        </Form.Item>
        <Form.Item
          label="新密码"
          name="newPassword"
          rules={[
            {
              required: true,
              message: '请输入有效的密码',
            },
            {
              min: 6,
              message: '请输入有效的密码',
            },
          ]}
        >
          <Input type="password" />
        </Form.Item>
        <Form.Item
          label="确认密码"
          name="newPassword2"
          rules={[
            {
              required: true,
              message: '请输入有效的原密码',
            },
            {
              min: 6,
              message: '请输入有效的密码',
            },
            ({ getFieldValue }) => {
              return {
                message: '两次输入的密码并不一致',
                validator: (_rule, value) => {
                  if (!value) return Promise.resolve();
                  const f = getFieldValue('newPassword');
                  if (!f) return Promise.resolve();
                  if (value !== f) {
                    // eslint-disable-next-line prefer-promise-reject-errors
                    return Promise.reject(`illegal password`);
                  }
                  return Promise.resolve();
                },
              };
            },
          ]}
        >
          <Input type="password" />
        </Form.Item>
        <Form.Item {...tailLayout}>
          <Button type="primary" htmlType="submit">
            确认
          </Button>
        </Form.Item>
      </Form>
    </ProCard>
  );
};

export default ChangePasswordForm;
