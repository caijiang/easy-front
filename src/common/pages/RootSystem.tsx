import Authorized from '@/components/Authorized/Authorized';
import PromiseRender from '@/components/Authorized/PromiseRender';
import { PageContainer } from '@ant-design/pro-layout';
import { Button, Popconfirm, Result, Statistic } from 'antd';
import React, { useState } from 'react';
import { request } from 'umi';

type EraseResponse = {
  seconds: number;
  time: number;
  message: string;
};

const RootSystem = () => {
  const [response, setResponse] = useState<EraseResponse>();
  //   {
  //   seconds: 15,
  //   message: 'test',
  //   time: 0,
  // }
  // {
  //   seconds: 15,
  //   message: 'success',
  //   time: Date.now(),
  // },
  // 配置权利 _M_CJ_SYSTEM_STRING
  const configButton = (
    <Authorized authority={['ROOT', '_M_CJ_SYSTEM_STRING']}>
      <a target="_blank" href="/systemString">
        配置
      </a>
    </Authorized>
  );

  if (response) {
    if (response.seconds === 0)
      return (
        <PageContainer extra={configButton}>
          <Result
            status="warning"
            title={response.message}
            extra={
              <Button type="primary" onClick={() => setResponse(undefined)}>
                返回
              </Button>
            }
          />
        </PageContainer>
      );
    const deadline = response.time + response.seconds * 1000;
    return (
      <PageContainer extra={configButton}>
        <Result
          status="success"
          title={response.message}
          extra={
            <Statistic.Countdown
              format="mm:ss:SSS"
              title="重载倒计时"
              value={deadline}
              onFinish={() => {
                window.location.reload();
              }}
            />
          }
        />
      </PageContainer>
    );
  }

  const status = async () => {
    try {
      const s = await request('/api/developmentHelpStatus', { skipErrorHandler: true });
      return !!s;
    } catch (e) {
      return false;
    }
  };
  const doErase = async () => {
    const r = await request<EraseResponse>('/api/erase', { method: 'POST' });
    setResponse({
      ...r,
      time: Date.now(),
    });
  };
  const eraseButton = (
    <PromiseRender
      ok={
        <Popconfirm title="确认要抹去所有数据么？" onConfirm={doErase}>
          <Button type="ghost" danger>
            抹去所有
          </Button>
        </Popconfirm>
      }
      error={<span></span>}
      promise={status()}
    ></PromiseRender>
  );
  return <PageContainer extra={configButton}>{eraseButton}</PageContainer>;
};

export default RootSystem;
