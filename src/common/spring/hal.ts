/* eslint-disable no-underscore-dangle */
import { isArray } from 'lodash';

interface HrefKnow {
  href: string;
}

/**
 * 怎么样根据定义增加特定的 links
 */
export interface HalRestResourceModel<K extends keyof any = never> {
  _links: Record<K | 'self', HrefKnow>;
}

/**
 * 非实体
 */
export interface HalRestResourceEmbedModel<K extends keyof any = never> {
  _links: Record<K, HrefKnow>;
}

export type HalRestResourceLinkOrData<K extends HalRestResourceModel<any>> = string | K;

// const a: HalRestResourceModel<"abc"> = {
//   _links: {
//     abc: { href: "" },
//     self: { href: "" },
//   },
// };

/**
 * 资源集合的原始数据
 * 把几种可能的组合都拉出来 尽量都支持
 */
export interface HalResourceCollectionModel<T extends HalRestResourceModel> {
  // Hal 风格
  _embedded?: Record<string, T[]>;
  _links?: Record<'self', HrefKnow>;
  /**
   * 可选的分页信息
   */
  page?: {
    /**
     * 页长度
     */
    size: number;
    totalElements: number;
    totalPages: number;
    /**
     * 页索引
     */
    number: number;
  };
  // 其他风格 其他风格也有 分页信息的
  data?:
    | T[]
    | {
        list?: T[];
        total?: number;
        pageSize?: number;
        /**
         * 页号
         */
        current?: number;
      };
  total?: number;
  pageSize?: number;
  /**
   * 页号
   */
  current?: number;
  // [key: string]: any;
}

/**
 * 将资源集合的原始数据调整成为数组
 * @param response
 */
export function readAsArray<T extends HalRestResourceModel>(
  response: HalResourceCollectionModel<T>,
): T[] {
  if (isArray(response)) return response;
  if (response.data != null) {
    if (isArray(response.data)) return response.data;
    return response.data.list || [];
  }
  const embedded = response._embedded;
  if (embedded == null) {
    // eslint-disable-next-line no-console
    console.warn('Spring Data Rest response has no list', response);
    return [];
  }
  // 寻找里面的 list
  const listKey = Object.keys(embedded).find((key) => {
    return Array.isArray(embedded[key]);
  });

  if (listKey == null) {
    // eslint-disable-next-line no-console
    console.warn('Spring Data Rest response has no list', response);
    return [];
  }

  return embedded[listKey!];
}

/**
 * 合并2个同类型的资源数组
 */
export function mergeHalResourceArray<T extends HalRestResourceModel>(a1?: T[], a2?: T[]): T[] {
  if (!a1 && !a2) return [];
  if (!a1) return a2!!;
  if (!a2) return a1!!;
  // 决定哪些可以被合并。
  const a1Links = a1.map((it) => it._links.self.href);
  const toAdd = a2.filter((e) => {
    // 不存在的 即可合并
    return !a1Links.some((href) => href === e._links.self.href);
  });
  return [...a1, ...toAdd];
}

/**
 *
 * @param input 模型或者链接
 * @returns 链接
 */
export function toHalResourceSelfHref(input: HalRestResourceModel | string) {
  if (typeof input === 'string') return input;
  return input._links.self.href;
}

/**
 *
 * @param href 链接对象
 * @returns id的文本描述
 */
export function toTextIdFromHref(href: HrefKnow) {
  const i = href.href.lastIndexOf('/');
  return href.href.substring(i + 1);
}

/**
 *
 * @param model 数据
 * @returns id的文本描述
 */
export function toTextIdForSelf(model: HalRestResourceModel) {
  return toTextIdFromHref(model._links.self);
}
