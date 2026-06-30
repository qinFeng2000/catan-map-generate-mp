export type RandomSource = () => number

export const mulberry32 = (seed: number): RandomSource => {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let next = value
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4_294_967_296
  }
}

export const fisherYates = <T>(input: readonly T[], random: RandomSource): T[] => {
  const output = [...input]
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[output[index], output[target]] = [output[target]!, output[index]!]
  }
  return output
}
