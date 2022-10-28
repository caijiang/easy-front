// 权限有关

import { checkPermissions } from '@/components/Authorized/CheckPermissions';
import { getAuthority } from '@/utils/authority';
import { isArray, isObject, isString } from 'lodash';

/**
 *
 * @param src 原始的权限信息
 * @returns 标准的权限字符串
 */
export function loadAuthorities(src: any): string | string[] {
  if (!src) return '';
  if (isString(src)) return src;
  if (isArray(src)) {
    // 如果是一个对象？
    return src.map((it) => {
      if (isString(it)) return removePrefix(it);
      if (isObject(it)) {
        // 看看里面有什么？
        const obj = it as Record<string, string>;
        if (obj.authority) return removePrefix(obj.authority);
        if (obj.role) return removePrefix(obj.role);
      }
      throw new Error(`不支持权限源数据：${it}`);
    });
  }
  // 如果是一个对象？？
  throw new Error(`不支持权限源数据：${src}`);
}
function removePrefix(input: string): any {
  if (input.toUpperCase().startsWith('ROLE_')) return input.toUpperCase().substring(5);
  return input.toUpperCase();
}

let currentAuthority: string | string[];

/**
 *
 * @param roles 权限
 * @returns 是否包含所需要的权限之一
 */
export function hasAnyRole(...roles: string[]) {
  if (!currentAuthority) currentAuthority = getAuthority();
  return roles.some((it) => checkPermissions(it, currentAuthority, true, false));
}
