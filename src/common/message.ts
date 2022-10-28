import type { ActionType } from '@ant-design/pro-table';
import { message } from 'antd';
import { request } from 'umi';
import type { RequestOptionsInit } from 'umi-request';

function readMessage(defaultMessage: string, input?: string | boolean): string | null {
  if (input === null || input === undefined) return defaultMessage;
  if (input === false) return null;
  if (typeof input === 'string') return input;
  return defaultMessage;
}

interface ResponsibleContext {
  loading?: string | boolean;
  success?: string | boolean;
  failed?: string | boolean;
  actionTypeRef?: React.MutableRefObject<ActionType | undefined>;
  onSuccess?: () => void;
}

/**
 * 批量处理
 * @param list  处理项目
 * @param context  描述性上下文
 */
export async function handleWithMessages(
  list: Promise<any>[],
  options?: ResponsibleContext,
): Promise<number> {
  const loading = readMessage('正在处理', options?.loading);
  const hide = loading == null ? null : message.loading(loading);
  try {
    const result = await Promise.all(list);
    if (hide) hide();
    const success = readMessage('处理完成', options?.success);
    if (success) message.success(success);
    if (options?.actionTypeRef?.current != null) {
      options.actionTypeRef.current.reload();
    }
    return result.filter((it) => !!it).length;
  } catch (error) {
    if (hide) hide();
    const failed = readMessage('处理失败', options?.failed);
    if (failed) message.error(failed);
    return 0;
  }
}

export async function handleWithMessage<T>(
  url: string,
  options?:
    | (RequestOptionsInit & {
        skipErrorHandler?: boolean | undefined;
      } & ResponsibleContext)
    | undefined,
): Promise<{ operation: boolean; result?: T }> {
  const loading = readMessage('正在处理', options?.loading);
  const hide = loading == null ? null : message.loading(loading);
  try {
    const result = await request<T>(url, options);
    if (hide) hide();
    const success = readMessage('处理完成', options?.success);
    if (success) message.success(success);
    if (options?.actionTypeRef?.current != null) {
      options.actionTypeRef.current.reload();
    }
    const { onSuccess } = options || {};
    onSuccess?.();
    return {
      operation: true,
      result,
    };
  } catch (error) {
    if (hide) hide();
    const failed = readMessage('处理失败', options?.failed);
    if (failed) message.error(failed);
    return { operation: false };
  }
}

export async function handleWithMessageWithoutRequest<T>(
  action: () => Promise<T>,
  options?: ResponsibleContext,
): Promise<{ operation: boolean; result?: T }> {
  const loading = readMessage('正在处理', options?.loading);
  const hide = loading == null ? null : message.loading(loading);
  try {
    const result = await action();
    if (hide) hide();
    const success = readMessage('处理完成', options?.success);
    if (success) message.success(success);
    if (options?.actionTypeRef?.current != null) {
      options.actionTypeRef.current.reload();
    }
    const { onSuccess } = options || {};
    onSuccess?.();
    return {
      operation: true,
      result,
    };
  } catch (error) {
    if (hide) hide();
    const failed = readMessage('处理失败', options?.failed);
    if (failed) message.error(failed);
    return { operation: false };
  }
}
