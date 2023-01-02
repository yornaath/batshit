import { setTimeout as setTimeoutP } from "timers/promises";
import { describe, expect, test } from "vitest";
import {
  create,
  bufferScheduler,
  windowScheduler,
  keyResolver,
} from "../src/index";
import * as mock from "./mock";

describe("batcher", () => {
  test("fetching items should work", async () => {
    const batcher = create<mock.User, number>({
      fetcher: async (ids) => {
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

  test("fetching items be batched in the same time window", async () => {
    let fetchCounter = 0;

    const batcher = create<mock.User, number>({
      fetcher: async (ids) => {
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
    const batcher = create<mock.User, number>({
      fetcher: async (ids) => {
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

  test("debouncing", async () => {
    let fetchCounter = 0;
    const batcher = create<mock.User, number>({
      fetcher: async (ids) => {
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

  test("with queryHasher config", async () => {
    let fetchCounter = 0;
    const batcher = create<mock.User, number>({
      fetcher: async (ids) => {
        fetchCounter++;
        return mock.usersByIds(ids);
      },
      scheduler: bufferScheduler(10),
      resolver: keyResolver("id"),
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

    const batcher = create<mock.User, number>({
      fetcher: async (ids) => {
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

  test("custom resolver", async () => {
    let fetchCounter = 0;
    const batcher = create<mock.Post, { authorId: number }, mock.Post[]>({
      fetcher: async (queries) => {
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
});
