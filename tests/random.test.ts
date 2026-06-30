import { describe, expect, it } from 'vitest'
import { fisherYates, mulberry32 } from '@/generator/random'

describe('fisherYates', () => {
  it('preserves the input and is reproducible with a seed', () => {
    const input = [1, 2, 3, 4, 5]
    const first = fisherYates(input, mulberry32(42))
    const second = fisherYates(input, mulberry32(42))
    expect(first).toEqual(second)
    expect(first).not.toEqual(input)
    expect([...first].sort()).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
  })
})
