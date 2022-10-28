// 不采纳spring-data-rest的做法

import type { ParamsType, RequestData } from '@ant-design/pro-components';
import type { SortOrder } from 'antd/lib/table/interface';
import lodash from 'lodash';
import { request } from 'umi';

interface Page<T> {
  content?: T[];
  totalElements?: number;
}

interface PageableRequest {
  page?: number | undefined;
  size?: number | undefined;
  pageNumber?: number | undefined;
  pageSize?: number | undefined;
}

type OpenApi<T> = (params: PageableRequest, options?: Record<string, any>) => Promise<Page<T>>;

type API<T> = (
  params: PageableRequest & Record<string, any>,
  sort: Record<string, SortOrder>,
  filter: Record<string, React.ReactText[] | null>,
  options?: Record<string, any>,
) => Promise<Page<T>>;

/**
 *
 * @param api openAPI 自动生成的异步远程函数
 * @returns 与ProTable.request兼容的异步函数
 */
export function toOpenApiRequest<T>(api: OpenApi<T>): (
  params: {
    pageSize?: number;
    current?: number;
    keyword?: string;
  },
  sort: Record<string, SortOrder>,
  filter: Record<string, React.ReactText[] | null>,
) => Promise<Partial<RequestData<T>>> {
  return async (params) => {
    const { current, pageSize } = params;
    const rs = await api({ ...params, page: current!! - 1, size: pageSize });
    return {
      data: rs.content,
      total: rs.totalElements,
      success: true,
    };
  };
}

/**
 * 高度定制搜索
 * @param uri 获取Page资源的uri
 * @param searchCustomer 通过输入各种参数自由定制 URLSearchParams, sort参数已预置处理手段可以不予理会
 * @returns 与ProTable.request兼容的异步函数
 */
export function toCustomRequest<T, Params extends ParamsType = ParamsType>(
  uri: string,
  searchCustomer: (
    search: URLSearchParams,
    params: Params,
    sort: Record<string, SortOrder>,
    filter: Record<string, React.ReactText[] | null>,
  ) => void,
): (
  params: Params & {
    pageSize?: number;
    current?: number;
    keyword?: string;
  },
  sort: Record<string, SortOrder>,
  filter: Record<string, React.ReactText[] | null>,
) => Promise<Partial<RequestData<T>>> {
  return async (params, sort, filter) => {
    const { current, pageSize } = params;
    const us = new URLSearchParams();
    us.append('page', `${current!! - 1}`);
    us.append('size', `${pageSize}`);

    if (sort) {
      lodash
        .toPairs(sort)
        .forEach((it) => us.append('sort', `${it[0]},${it[1] == 'ascend' ? 'asc' : 'desc'}`));
    }

    searchCustomer(us, params, sort, filter);
    const rs = await request<Page<T>>(uri, {
      method: 'GET',
      params: us,
    });
    return {
      data: rs.content,
      total: rs.totalElements,
      success: true,
    };
  };
}

export function toRequest<T>(api: API<T>): (
  params: {
    pageSize?: number;
    current?: number;
    keyword?: string;
  },
  sort: Record<string, SortOrder>,
  filter: Record<string, React.ReactText[] | null>,
) => Promise<Partial<RequestData<T>>> {
  return async (params, sort, filter) => {
    const { current, pageSize } = params;
    const rs = await api({ ...params, page: current!! - 1, size: pageSize }, sort, filter);
    return {
      data: rs.content,
      total: rs.totalElements,
      success: true,
    };
  };
}
