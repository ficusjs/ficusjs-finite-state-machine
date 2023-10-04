export function toArray<T> (item: T | T[] | undefined): T[] {
  return item === undefined ? [] : ([] as T[]).concat(item)
}
