import { isEqual } from 'lodash';

/**
 * 修改的字段内容
 */
type ChangedField = {
  /**
   * 字段名称
   */
  field: string;
  /**
   * 新值
   */
  current?: any;
  /**
   * 原值
   */
  source?: any;
};

/**
 *
 * @param current 修订之后的对象
 * @param source 修订之前的
 * @param keys 关注的键名（缺省为所有键）
 * @returns 被修改的字段信息；如果什么都修改则返回空对象
 */
export function findModifiedFieldsAsObject<T>(
  current: T,
  source: T,
  fields?: string[],
): Record<string, any> | undefined {
  const fs = findModifiedFields(current, source, fields);
  if (fs.length === 0) return undefined;
  const ci = {};
  fs.forEach((it) => {
    ci[it.field] = it.current;
  });
  return ci;
}
/**
 *
 * @param current 修订之后的对象
 * @param source 修订之前的
 * @param keys 关注的键名（缺省为所有键）
 * @returns 被修改的字段信息
 */
export function findModifiedFields<T>(current: T, source: T, fields?: string[]): ChangedField[] {
  const fs = (fields || Object.keys(current)).filter((it) => it !== 'index');
  // console.log('current:', current, ',source:', source);
  const list: ChangedField[] = [];
  fs.forEach((field) => {
    // 情况 1: 前后都有值 直接比较即可
    // 情况 2: 前有值，而后无，则必须设置 为 null
    // 情况 3: 前无值，后有值 直接比较即可
    // 情况 4: 前后都无值 无需
    const newCurrent = current[field];

    // if (newCurrent !== source[field]) {
    if (!isEqual(newCurrent, source[field])) {
      // 如果2者都是空则跳过
      if (!newCurrent && source[field] === null) return;
      list.push({
        field,
        current: newCurrent === undefined ? null : newCurrent,
        source: source[field],
      });
    }
  });
  return list;
}
