export function isPromise (obj: any): boolean {
  return (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'
}
