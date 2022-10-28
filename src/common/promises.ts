import { uniq } from 'lodash';

/**
 * 将一批数据按照特定协议进行协作处理
 * @param origin 原数组
 * @param rowKey 取key方法
 * @param promiser  可以根据 key 获得的期望
 * @param field 附加的字段名
 * @returns 增加了[field]字段的新数组
 */
export async function batchPromiseAndReplace<O, K, T, MR extends string>(
  origin: O[],
  rowKey: (input: O) => K,
  promiser: (key: K) => Promise<T | undefined>,
  field: MR,
): Promise<(O & { [k in MR]: T | undefined })[]> {
  const rsList = await Promise.all(
    uniq(origin.map((it) => rowKey(it))).map(async (it) => ({
      key: it,
      value: await promiser(it),
    })),
  );

  return origin.map((it) => {
    const key = rowKey(it);
    const value = rsList.find((that) => that.key === key)?.value;
    const addition = {} as any;
    addition[field] = value;
    return { ...it, ...addition };
  });
}
