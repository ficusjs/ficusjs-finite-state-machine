import { describe, it } from '@jest/globals'
import { toArray } from './to-array'

describe('to-array', () => {
  it('should return an empty array given undefined', () => {
    expect(toArray(undefined)).toEqual([])
  })

  it('should return an array given an array', () => {
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('should return an array given a non-array', () => {
    expect(toArray(1)).toEqual([1])
  })
})
