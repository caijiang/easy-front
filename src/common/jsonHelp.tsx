import { isArray, isArrayLikeObject, isObject } from 'lodash';

/**
 * 如果输入是一个类似数组的东西，将其他转换为普通数组
 * @param input 数组或者类似数组
 */
export function toArray<T = any>(input: any): T[] {
  if (!input) return input;
  if (isArray(input)) return input;
  // 只针对 0: 1: 这样的键值
  if (isArrayLikeObject(input)) {
    // console.log('isArrayLikeObject is true');

    // const keys = Object.keys(input)
    const rs: any[] = [];
    Object.keys(input).forEach((key) => {
      rs.push(input[key]);
    });
    return rs;
  }
  if (isObject(input)) {
    const keys = Object.keys(input);
    if (
      keys.every((str) => {
        try {
          parseInt(str, 10);
          return true;
        } catch (e) {
          return false;
        }
      })
    ) {
      // console.log('all key is int');
      const rs: any[] = [];
      Object.keys(input).forEach((key) => {
        rs.push(input[key]);
      });
      return rs;
    }
  }

  return [input];
}
