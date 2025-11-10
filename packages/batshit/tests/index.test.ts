import { injectDevtools } from "@yornaath/batshit-devtools";
import { setTimeout as setTimeoutP } from "timers/promises";
import { describe, expect, test } from "vitest";
import {performance} from "node:perf_hooks"
import {
  create,
  bufferScheduler,
  windowScheduler,
  keyResolver,
  indexedResolver,
  windowedFiniteBatchScheduler,
  maxBatchSizeScheduler,
} from "../src/index";
import * as mock from "./mock";



const tests = () => {
  test("fetching items should work", async () => {
    const batcher = create({
      fetcher: async (ids: number[]) => {
        return mock.usersByIds(ids);
      },
      resolver: keyResolver("id"),
    });

    const two = await batcher.fetch(2);

    expect(two).toEqual({ id: 2, name: "Alice" });

    const all = await Promise.all([
      batcher.fetch(1),
      batcher.fetch(2),
      batcher.fetch(3),
      batcher.fetch(4),
      batcher.fetch(5),
    ]);

    expect(all).toEqual(mock.users);
  });

  // test("un-indexed test", async () => {
  //   const batcher = create({
  //     fetcher: async (ids: number[]) => {
  //       return mock.bigUserById(ids);
  //     },
  //     resolver: keyResolver("id"),
  //     scheduler: windowScheduler(1000),
  //   });

  //   console.time("unindexed")
  //   await Promise.all(range(mock.BIG_USER_LIST_LENGTH).map((i) => batcher.fetch(i)));
  //   console.timeEnd("unindexed")

  // });

  // test("indexed test", async () => {
  //   const batcherIndexed = create({
  //     fetcher: async (ids: number[]) => {
  //       return mock.bigUserById(ids);
  //     },
  //     resolver: keyResolver("id", { indexed: true }),
  //     scheduler: windowScheduler(1000),
  //   });

  //   console.time("indexed")
  //   await Promise.all(range(mock.BIG_USER_LIST_LENGTH).map((i) => batcherIndexed.fetch(i)));
  //   console.timeEnd("indexed")
  // });

  test("fetching items be batched in the same time window", async () => {
    let fetchCounter = 0;

    const batcher = create({
      fetcher: async (ids: number[]) => {
        fetchCounter++;
        return mock.usersByIds(ids);
      },
      resolver: keyResolver("id"),
    });

    const twoItemsR = Promise.all([batcher.fetch(2), batcher.fetch(5)]);

    await setTimeoutP(30);

    const allR = Promise.all([
      batcher.fetch(1),
      batcher.fetch(2),
      batcher.fetch(3),
      batcher.fetch(4),
      batcher.fetch(5),
    ]);

    const [twoItems, all] = await Promise.all([twoItemsR, allR]);

    expect(twoItems).toEqual([
      { id: 2, name: "Alice" },
      { id: 5, name: "Tim" },
    ]);

    expect(all).toEqual(mock.users);

    expect(fetchCounter).toBe(2);
  });

  test("windowing", async () => {
    let fetchCounter = 0;
    const batcher = create({
      fetcher: async (ids: number[]) => {
        fetchCounter++;
        return mock.usersByIds(ids);
      },
      resolver: keyResolver("id"),
      scheduler: windowScheduler(10),
    });
    const one = batcher.fetch(1);
    await setTimeoutP(2);
    const two = batcher.fetch(2);
    await setTimeoutP(3);
    const three = batcher.fetch(3);
    await setTimeoutP(5);
    const four = batcher.fetch(4);

    const all = await Promise.all([one, two, three, four]);

    expect(fetchCounter).toBe(2);
    expect(all).toEqual([
      { id: 1, name: "Bob" },
      { id: 2, name: "Alice" },
      { id: 3, name: "Sally" },
      { id: 4, name: "John" },
    ]);
  });

  test("early execution", async () => {
    let fetchCounter = 0;
    const batcher = create({
      fetcher: async (ids: number[]) => {
        return mock.usersByIds(ids);
      },
      resolver: keyResolver("id"),
      scheduler: windowScheduler(33),
    });

    let all = Promise.all([batcher.fetch(1), batcher.fetch(2), batcher.fetch(3), batcher.fetch(4)]);
    
    expect(fetchCounter).toBe(0);

    let now = performance.now();
    batcher.next()
    await all;
    let elapsed = performance.now() - now;
    expect(elapsed).toBeLessThan(5);

    all = Promise.all([batcher.fetch(1), batcher.fetch(2), batcher.fetch(3), batcher.fetch(4)]);

    now = performance.now();
    await all;
    elapsed = performance.now() - now;
    expect(elapsed).toBeGreaterThanOrEqual(33)
  })

  test("debouncing", async () => {
    let fetchCounter = 0;
    const batcher = create({
      fetcher: async (ids: number[]) => {
        fetchCounter++;
        return mock.usersByIds(ids);
      },
      resolver: keyResolver("id"),
      scheduler: bufferScheduler(10),
    });

    const one = batcher.fetch(1);
    await setTimeoutP(2);
    const two = batcher.fetch(2);
    await setTimeoutP(3);
    const three = batcher.fetch(3);
    await setTimeoutP(5);
    const four = batcher.fetch(4);

    const all = await Promise.all([one, two, three, four]);

    expect(fetchCounter).toBe(1);
    expect(all).toEqual([
      { id: 1, name: "Bob" },
      { id: 2, name: "Alice" },
      { id: 3, name: "Sally" },
      { id: 4, name: "John" },
    ]);
  });

  test("requests for the same ids should be deduplicates and return the same values", async () => {
    let fetchCounter = 0;
    let fetchedIds!: number[];

    const batcher = create({
      fetcher: async (ids: number[]) => {
        fetchCounter++;
        fetchedIds = ids;
        return mock.usersByIds(ids);
      },
      resolver: keyResolver("id"),
      scheduler: bufferScheduler(15),
    });

    const one = batcher.fetch(1);
    await setTimeoutP(2);
    const two = batcher.fetch(2);
    await setTimeoutP(3);
    const three = batcher.fetch(1);
    await setTimeoutP(5);
    const four = batcher.fetch(2);

    const all = await Promise.all([one, two, three, four]);

    expect(fetchCounter).toBe(1);

    expect(fetchedIds).toEqual([1, 2]);

    expect(all).toEqual([
      { id: 1, name: "Bob" },
      { id: 2, name: "Alice" },
      { id: 1, name: "Bob" },
      { id: 2, name: "Alice" },
    ]);
  });

  test("key resolver", async () => {
    const batcher = create({
      fetcher: async (ids: number[]) => {
        return mock.usersByIds(ids.filter((id) => id !== 2));
      },
      resolver: keyResolver("id"),
    });

    const two = await batcher.fetch(2);
    expect(two).toBeNull();

    const three = await batcher.fetch(3);
    expect(three).toEqual({ id: 3, name: "Sally" });
  });

  test("custom resolver", async () => {
    let fetchCounter = 0;
    const batcher = create({
      fetcher: async (queries: { authorId: number }[]) => {
        fetchCounter++;
        return mock.postsByAuthorId(queries.map((q) => q.authorId));
      },
      scheduler: windowScheduler(10),
      resolver: (posts, query) =>
        posts.filter((post) => post.authorId === query.authorId),
    });

    const alicesPostsRequest = batcher.fetch({ authorId: 1 });
    const bobsPosts = batcher.fetch({ authorId: 2 });

    const [alicesPosts, bobsPost] = await Promise.all([
      alicesPostsRequest,
      bobsPosts,
    ]);

    expect(alicesPosts).toEqual([
      { id: 1, title: "Hello", authorId: 1 },
      { id: 2, title: "World", authorId: 1 },
    ]);

    expect(bobsPost).toEqual([
      { id: 3, title: "Hello", authorId: 2 },
      { id: 4, title: "World", authorId: 2 },
    ]);

    expect(fetchCounter).toBe(1);
  });

  test("record responses", async () => {
    const batcher = create({
      fetcher: async (ids: number[]) => {
        const users = await mock.usersByIds(ids);
        const usersRecord = users.reduce<Record<number, mock.User>>(
          (index, user) => {
            return {
              ...index,
              [user.id]: user,
            };
          },
          {}
        );
        return usersRecord;
      },
      resolver: indexedResolver(),
    });

    const two = await batcher.fetch(2);

    expect(two).toEqual({ id: 2, name: "Alice" });

    const all = await Promise.all([
      batcher.fetch(1),
      batcher.fetch(2),
      batcher.fetch(3),
      batcher.fetch(4),
      batcher.fetch(5),
    ]);

    expect(all).toEqual(mock.users);
  });

  test("handle undefined responses", async () => {
    const batcher = create({
      fetcher: async (ids: number[]) => {
        return mock.usersByIds(ids);
      },
      resolver: (items, id) => items.find((item) => item.id === id) ?? null,
    });

    const all = await Promise.all([batcher.fetch(2), batcher.fetch(100)]);

    expect(all).toEqual([{ id: 2, name: "Alice" }, null]);
  });

  test("immediate scheduled batchers should work", async () => {
    let fetchCounter = 0;
    const batcher = create({
      fetcher: async (ids: number[]) => {
        fetchCounter++;
        return mock.usersByIds(ids);
      },
      scheduler: () => "immediate",
      resolver: keyResolver("id"),
    });

    const one = batcher.fetch(1);
    const two = batcher.fetch(2);

    expect(await one).toEqual({ id: 1, name: "Bob" });
    expect(await two).toEqual({ id: 2, name: "Alice" });

    expect(fetchCounter).toEqual(2);
  });

  describe("windowedBatchScheduler", () => {
    test("should batch within a window, but fetch immediatly if batch size 2 is reached", async () => {
      let fetchCounter = 0;
      const batcher = create({
        fetcher: async (ids: number[]) => {
          fetchCounter++;
          return mock.usersByIds(ids);
        },
        scheduler: windowedFiniteBatchScheduler({
          windowMs: 10,
          maxBatchSize: 2,
        }),
        resolver: keyResolver("id"),
      });

      const one = batcher.fetch(1);
      const two = batcher.fetch(2);
      const three = batcher.fetch(3);
      const four = batcher.fetch(4);

      const all = await Promise.all([one, two, three, four]);

      expect(fetchCounter).toBe(2);

      expect(all).toEqual([
        { id: 1, name: "Bob" },
        { id: 2, name: "Alice" },
        { id: 3, name: "Sally" },
        { id: 4, name: "John" },
      ]);
    });

    test("should batch within a window, but fetch immediatly if batch size 1 is reached", async () => {
      let fetchCounter = 0;
      const batcher = create({
        fetcher: async (ids: number[]) => {
          fetchCounter++;
          return mock.usersByIds(ids);
        },
        scheduler: windowedFiniteBatchScheduler({
          windowMs: 10,
          maxBatchSize: 1,
        }),
        resolver: keyResolver("id"),
      });

      const one = batcher.fetch(1);
      const two = batcher.fetch(2);
      const three = batcher.fetch(3);
      const four = batcher.fetch(4);

      const all = await Promise.all([one, two, three, four]);

      expect(fetchCounter).toBe(4);

      expect(all).toEqual([
        { id: 1, name: "Bob" },
        { id: 2, name: "Alice" },
        { id: 3, name: "Sally" },
        { id: 4, name: "John" },
      ]);
    });

    test("should work with the next batch after first batch is made", async () => {
      let fetchCounter = 0;
      const batcher = create({
        fetcher: async (ids: number[]) => {
          fetchCounter++;
          return mock.usersByIds(ids);
        },
        scheduler: windowedFiniteBatchScheduler({
          windowMs: 10,
          maxBatchSize: 1,
        }),
        resolver: keyResolver("id"),
      });

      const one = batcher.fetch(1);
      const two = batcher.fetch(2);
      const firstTwo = await Promise.all([one, two]);

      expect(fetchCounter).toBe(2);

      const three = batcher.fetch(3);
      const four = batcher.fetch(4);

      const lastTwo = await Promise.all([three, four]);

      expect(fetchCounter).toBe(4);

      expect([...firstTwo, ...lastTwo]).toEqual([
        { id: 1, name: "Bob" },
        { id: 2, name: "Alice" },
        { id: 3, name: "Sally" },
        { id: 4, name: "John" },
      ]);
    });

    test("manuall implementation of windowed batcher", async () => {
      let fetchCounter = 0;
      const batcher = create({
        fetcher: async (ids: number[]) => {
          fetchCounter++;
          return mock.usersByIds(ids);
        },
        scheduler: (start, latest, batchSize) => {
          if (batchSize >= 1) return "immediate";
          const spent = latest - start;
          return 10 - spent;
        },
        resolver: keyResolver("id"),
      });

      const one = batcher.fetch(1);
      const two = batcher.fetch(2);
      const three = batcher.fetch(3);
      const four = batcher.fetch(4);

      const all = await Promise.all([one, two, three, four]);

      expect(fetchCounter).toBe(4);

      expect(all).toEqual([
        { id: 1, name: "Bob" },
        { id: 2, name: "Alice" },
        { id: 3, name: "Sally" },
        { id: 4, name: "John" },
      ]);
    });
  });

  describe("maxBatchSizeScheduler", () => {
    test("should batch calls when max batch size of 1 is reached", async () => {
      let fetchCounter = 0;
      const batcher = create({
        fetcher: async (ids: number[]) => {
          fetchCounter++;
          return mock.usersByIds(ids);
        },
        scheduler: maxBatchSizeScheduler({
          maxBatchSize: 1,
        }),
        resolver: keyResolver("id"),
      });

      const one = batcher.fetch(1);
      const two = batcher.fetch(2);
      const three = batcher.fetch(3);
      const four = batcher.fetch(4);

      const all = await Promise.all([one, two, three, four]);

      expect(fetchCounter).toBe(4);

      expect(all).toEqual([
        { id: 1, name: "Bob" },
        { id: 2, name: "Alice" },
        { id: 3, name: "Sally" },
        { id: 4, name: "John" },
      ]);
    });

    test("should batch calls when max batch size of 4 is reached", async () => {
      let fetchCounter = 0;
      const batcher = create({
        fetcher: async (ids: number[]) => {
          fetchCounter++;
          return mock.usersByIds(ids);
        },
        scheduler: maxBatchSizeScheduler({
          maxBatchSize: 4,
        }),
        resolver: keyResolver("id"),
      });

      const one = batcher.fetch(1);
      const two = batcher.fetch(2);
      const three = batcher.fetch(3);
      const four = batcher.fetch(4);

      const all = await Promise.all([one, two, three, four]);

      expect(fetchCounter).toBe(1);

      expect(all).toEqual([
        { id: 1, name: "Bob" },
        { id: 2, name: "Alice" },
        { id: 3, name: "Sally" },
        { id: 4, name: "John" },
      ]);
    });

    test("should work with the next batch after first batch is made", async () => {
      let fetchCounter = 0;
      const batcher = create({
        fetcher: async (ids: number[]) => {
          fetchCounter++;
          return mock.usersByIds(ids);
        },
        scheduler: maxBatchSizeScheduler({
          maxBatchSize: 1,
        }),
        resolver: keyResolver("id"),
      });

      const one = batcher.fetch(1);
      const two = batcher.fetch(2);
      const firstTwo = await Promise.all([one, two]);

      expect(fetchCounter).toBe(2);

      const three = batcher.fetch(3);
      const four = batcher.fetch(4);

      const lastTwo = await Promise.all([three, four]);

      expect(fetchCounter).toBe(4);

      expect([...firstTwo, ...lastTwo]).toEqual([
        { id: 1, name: "Bob" },
        { id: 2, name: "Alice" },
        { id: 3, name: "Sally" },
        { id: 4, name: "John" },
      ]);
    });
  });
};

describe("batcher", tests);
// describe("batcher-with-devtools", () => {
//   injectDevtools(() => { });
//   return tests();
// });


const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);