import { isArray } from 'lodash';

export interface ResourceModel {
  path: string;
  url: string;
}

/**
 *
 * @param input Upload 组件默认的 value
 * @returns {string} 上传的path
 */
export function readFirstPathFromUploadValue(input: any): string | undefined {
  if (!input) return undefined;
  // 是数组？ 取第一个
  let invoice = isArray(input) ? input[0] : input;
  invoice = invoice.response ? invoice.response : invoice;
  invoice = invoice.path;
  return invoice;
}
