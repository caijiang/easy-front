export const isDevelopment = (): boolean => {
  const { NODE_ENV } = process.env;
  return NODE_ENV === 'development';
};

export function developmentOr<T, Z>(developmentValue: T, productionValue: Z): T | Z {
  if (isDevelopment()) return developmentValue;
  return productionValue;
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
