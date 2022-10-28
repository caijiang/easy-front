import { isArray } from 'lodash';
import { request } from 'umi';
import type { HalRestResourceModel, HalResourceCollectionModel } from './hal';
import { readAsArray } from './hal';

/**
 * 跟 ant design 兼容的分页数据
 */
export interface AntDesignPage<T extends HalRestResourceModel> {
  data: T[];
  total: number;
  success: boolean;
  pageSize: number;
  /**
   * 页号
   */
  current: number;
}

function toSpringSortParameter(input: unknown) {
  if (input && typeof input === 'object') {
    const key = Object.keys(input)[0];
    const rs = input[key];
    const rs2 = rs === 'ascend' ? 'asc' : 'desc';
    return {
      sort: `${key},${rs2}`,
    };
  }
  return undefined;
}

export async function requestPage<T extends HalRestResourceModel>(
  uri: string,
  params?: Record<string, unknown>,
) {
  const { current, number, pageSize, sort } = params || {};
  const n = number !== undefined ? number : (current as number) - 1;
  const mySort = toSpringSortParameter(sort);
  const response = await request(uri, {
    params: {
      ...params,
      number: n,
      page: n,
      size: pageSize || 20,
      ...mySort,
    },
  });
  return readAsPage<T>(response);
}

function readAsPageInformation<T extends HalRestResourceModel>(
  response: HalResourceCollectionModel<T>,
) {
  const { total, pageSize, current, data, page } = response;
  if (page) {
    return {
      total: page.totalElements,
      success: true,
      pageSize: page.size,
      current: page.number + 1,
    };
  }
  if (total !== undefined && pageSize !== undefined && current !== undefined) {
    return {
      total,
      success: true,
      pageSize,
      current,
    };
  }
  if (data != null) {
    if (isArray(data)) throw new Error(`response don't have any page information. ${response}`);
    const { total: t2, pageSize: ps2, current: c2 } = data;

    if (t2 !== undefined && ps2 !== undefined && c2 !== undefined) {
      return {
        total: t2,
        success: true,
        pageSize: ps2,
        current: c2,
      };
    }
  }
  throw new Error(`response don't have any page information. ${response}`);
}

/**
 * 将资源集合的原始数据调整成为 ant design 标准
 * @param response
 */
export function readAsPage<T extends HalRestResourceModel>(
  response: HalResourceCollectionModel<T>,
): AntDesignPage<T> {
  const { page } = response;
  if (page == null) {
    throw new Error(`response don't have any page information. ${response}`);
  }

  return {
    ...readAsPageInformation(response),
    data: readAsArray(response),
  };
}
