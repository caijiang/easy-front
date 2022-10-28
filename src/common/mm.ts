import moment from 'moment';
// import { formatter } from '@/components/MoneyInput';

export function moneyFormatter(v: number | string | undefined) {
  if (v === null || v === undefined || v === Number.NaN) return '';
  if (typeof v === 'string')
    return `￥ ${v.replaceAll('￥', '')}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `￥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function moneyParser(display: string | undefined) {
  if (!display) return '';
  const x = display.replaceAll('￥ ', '').replaceAll(',', '');
  return x;
  // return x;
}

export const antDesignInputNumberAsMoney = {
  parser: moneyParser,
  formatter: moneyFormatter,
};

export const antDesignInputNumberAsPercent = {
  min: 0,
  max: 1,
  step: 0.01,
  formatter: percentFormatter,
  parser: percentParser,
};

export function percentFormatter(value: number | string | undefined) {
  if (value === undefined) return '%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '%';
  const x = Math.round(num * 10000) / 100;
  if (typeof value === 'string' && value.endsWith('.')) return `${x}.%`;
  return `${x}%`;
}

export function percentParser(displayValue: string | undefined): string {
  if (!displayValue) return '';
  const num = parseFloat(displayValue.replace('%', '')) / 100;
  if (Number.isNaN(num)) return '';

  if (displayValue.endsWith('.%')) return `${num}.`;
  return `${num}`;
}

export function printBooleanStatus(value: boolean) {
  return value ? '✅' : '❌';
}

export function printPercentValue(value?: number) {
  if (value === 0) return '0%';
  if (!value) return '-';
  return `${Math.floor(value * 100)}%`;
}

export function printMoneyValue(value?: number) {
  if (!value) return '-';
  return moneyFormatter(value);
}

export function printLocalDateTime(value?: string) {
  if (!value) return '-';
  return moment(value).format('YYYY-M-D HH:mm:ss');
}

export function printDuration(value?: number) {
  if (value === undefined || value === null) return '-';
  return moment.duration(value * 1000).humanize(true);
}

/**
 *
 * @param value 金额
 * @returns {number} 四舍五入后保留2位小数点的金额
 */
export function moneyMe(value: number) {
  const hd = Math.round(value * 100);
  return hd / 100;
}
