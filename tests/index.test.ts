import { setTimeout as setTimeoutP } from "timers/promises"
import { describe, expect, test } from 'vitest'
import { create, bufferScheduler, windowScheduler } from "../src/index"

const data = [
  { id: 1, name: "foo" },
  { id: 2, name: "bar" },
  { id: 3, name: "lorem" },
  { id: 4, name: "ipsum" },
  { id: 5, name: "foobar" }
]

describe("batcher", () => {
  test('fetching items should work', async () => {
    const batcher = create<{ id: number, name: string }, number>({
      fetcher: async (ids) => {
        return Object.values(data).filter((item) => ids.includes(item.id))
      },
      equality: "id",
    })

    const two = await batcher.fetch(2)

    expect(two).toEqual({ id: 2, name: "bar" })

    const all = await Promise.all([
      batcher.fetch(1), batcher.fetch(2), batcher.fetch(3), batcher.fetch(4), batcher.fetch(5)
    ])

    expect(all).toEqual(data)
  })

  test('fetching items be batched in the same time window', async () => {
    let fetchCounter = 0

    const batcher = create<{ id: number, name: string }, number>({
      fetcher: async (ids) => {
        fetchCounter++
        return Object.values(data).filter((item) => ids.includes(item.id))
      },
      equality: "id",
    })

    const twoItemsR = Promise.all([
      batcher.fetch(2), batcher.fetch(5)
    ])

    await setTimeoutP(30)

    const allR = Promise.all([
      batcher.fetch(1), batcher.fetch(2), batcher.fetch(3), batcher.fetch(4), batcher.fetch(5)
    ])

    const [twoItems, all] = await Promise.all([twoItemsR, allR])

    expect(twoItems).toEqual([
      { id: 2, name: "bar" },
      { id: 5, name: "foobar" }
    ])

    expect(all).toEqual(data)

    expect(fetchCounter).toBe(2)
  })

  test("windowing", async () => {
    let fetchCounter = 0
    const batcher = create<{ id: number, name: string }, number>({
      fetcher: async (ids) => {
        fetchCounter++
        return Object.values(data).filter((item) => ids.includes(item.id))
      },
      equality: "id",
      scheduler: windowScheduler(10)
    })
    const one = batcher.fetch(1)
    await setTimeoutP(2)
    const two = batcher.fetch(2)
    await setTimeoutP(3)
    const three = batcher.fetch(3)
    await setTimeoutP(5)
    const four = batcher.fetch(4)

    const all = await Promise.all([one, two, three, four])

    expect(fetchCounter).toBe(2)
    expect(all).toEqual([
      { id: 1, name: "foo" },
      { id: 2, name: "bar" },
      { id: 3, name: "lorem" },
      { id: 4, name: "ipsum" }
    ])
  })

  test("debouncing", async () => {
    let fetchCounter = 0
    const batcher = create<{ id: number, name: string }, number>({
      fetcher: async (ids) => {
        fetchCounter++
        return Object.values(data).filter((item) => ids.includes(item.id))
      },
      equality: "id",
      scheduler: bufferScheduler(10)
    })

    const one = batcher.fetch(1)
    await setTimeoutP(2)
    const two = batcher.fetch(2)
    await setTimeoutP(3)
    const three = batcher.fetch(3)
    await setTimeoutP(5)
    const four = batcher.fetch(4)

    const all = await Promise.all([one, two, three, four])

    expect(fetchCounter).toBe(1)
    expect(all).toEqual([
      { id: 1, name: "foo" },
      { id: 2, name: "bar" },
      { id: 3, name: "lorem" },
      { id: 4, name: "ipsum" }
    ])
  })

  test("with queryHasher config", async () => {
    let fetchCounter = 0
    const batcher = create<{ id: number, name: string }, number>({
      fetcher: async (ids) => {
        fetchCounter++
        return Object.values(data).filter((item) => ids.includes(item.id))
      },
      scheduler: bufferScheduler(10),
      equality: "id",
    })

    const one = batcher.fetch(1)
    await setTimeoutP(2)
    const two = batcher.fetch(2)
    await setTimeoutP(3)
    const three = batcher.fetch(3)
    await setTimeoutP(5)
    const four = batcher.fetch(4)

    const all = await Promise.all([one, two, three, four])

    expect(fetchCounter).toBe(1)
    expect(all).toEqual([
      { id: 1, name: "foo" },
      { id: 2, name: "bar" },
      { id: 3, name: "lorem" },
      { id: 4, name: "ipsum" }
    ])
  })

  test("requests for the same ids should be deduplicates and return the same values", async () => {
    let fetchCounter = 0
    let fetchedIds!: number[]

    const batcher = create<{ id: number, name: string }, number>({
      fetcher: async (ids) => {
        fetchCounter++
        fetchedIds = ids
        return Object.values(data).filter((item) => ids.includes(item.id))
      },
      equality: "id",
      scheduler: bufferScheduler(15),
    })

    const one = batcher.fetch(1)
    await setTimeoutP(2)
    const two = batcher.fetch(2)
    await setTimeoutP(3)
    const three = batcher.fetch(1)
    await setTimeoutP(5)
    const four = batcher.fetch(2)

    const all = await Promise.all([one, two, three, four])

    expect(fetchCounter).toBe(1)

    expect(fetchedIds).toEqual([1, 2])

    expect(all).toEqual([
      { id: 1, name: "foo" },
      { id: 2, name: "bar" },
      { id: 1, name: "foo" },
      { id: 2, name: "bar" },
    ])
  })
})