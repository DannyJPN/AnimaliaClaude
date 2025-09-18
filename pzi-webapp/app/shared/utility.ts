export function getEnumKeyByValue<T extends Record<string, string>>(enumObj: T, value: string): keyof T | undefined {
  return Object.keys(enumObj).find(key => enumObj[key] === value) as keyof T | undefined;
}