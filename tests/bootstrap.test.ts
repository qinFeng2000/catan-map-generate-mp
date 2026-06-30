import { describe, expect, it } from 'vitest'
import appConfig from '@/app.config'

describe('app shell', () => {
  it('registers the generator as the only page', () => {
    expect(appConfig.pages).toEqual(['pages/index/index'])
  })
})
