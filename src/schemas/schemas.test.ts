/**
 * Runs DeepSpace's built-in schema checker ("schema lint") on our collections.
 * It catches permission mistakes like a visibility rule that is never used, or
 * an owner column a student could fake. An empty list means no warnings.
 */

import { describe, expect, it } from 'vitest'
import { lintSchema } from 'deepspace/worker'
import { itemsSchema } from './items-schema'
import { requestsSchema } from './requests-schema'

describe('schema lint', () => {
  it('items schema has no warnings', () => {
    expect(lintSchema(itemsSchema)).toEqual([])
  })

  it('requests schema has no warnings', () => {
    expect(lintSchema(requestsSchema)).toEqual([])
  })
})
