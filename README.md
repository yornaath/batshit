# @yornaath/batshit [![CI](https://github.com/yornaath/batshit/actions/workflows/ci.yml/badge.svg)](https://github.com/yornaath/batshit/actions/workflows/ci.yml)

A batch manager that will deduplicate and batch requests for a given data type made within a window of time (or other custom scheduling). Useful to batch requests made from multiple react components that uses react-query or do batch processing of accumulated tasks.

### Codesandbox example
Here is a codesanbox example using react, typescript, vite and the zeitgeist prediction-markets indexer api.
It fetches markets up front and then batches all liquidity pool fetches made from the individual components into one request.

[Codesandbox](https://codesandbox.io/s/yornaath-batshit-example-8f8q3w?file=/src/App.tsx)

### Example with devtools
Example using zeitgeist market and pool data with included devtools to inspect the batching process.
The working live code for the example linked below can be found in [./packages/example](https://github.com/yornaath/batshit/tree/master/packages/example)

[Vercel Example app](https://batshit-example.vercel.app/)

## Install
```bash
yarn add @yornaath/batshit
```

## Quickstart

Here we are creating a simple batcher that will batch all fetches made within a window of 10 ms into one request.

```ts
import { create, keyResolver, windowScheduler } from "@yornaath/batshit";

type User = { id: number; name: string };

const users = create({
  fetcher: async (ids: number[]) => {
    return client.users.where({
      id_in: ids,
    });
  },
  resolver: keyResolver("id"),
  scheduler: windowScheduler(10), // Default and can be omitted.
});

/**
 * Requests will be batched to one call since they are done within the same time window of 10 ms.
 */
const bob = users.fetch(1);
const alice = users.fetch(2);

const bobUndtAlice = await Promise.all([bob, alice]);

await delay(100);

/**
 * New Requests will be batched in a another call since not within the first timeframe.
 */
const joe = users.fetch(3);
const margareth = users.fetch(4);

const joeUndtMargareth = await Promise.all([joe, margareth]);
```

## React(query) Example

Here we are also creating a simple batcher that will batch all fetches made within a window of 10 ms into one request. Since all <UserDetails /> items are rendered in one go their individual fetches will be batched into one request.

**Note: a batcher for a group of items should only be created once. So creating them inside hooks wont work as intended.**

```ts
import { useQuery } from "react-query";
import { create, windowScheduler } from "@yornaath/batshit";

const users = create({
  fetcher: async (ids: number[]) => {
    return client.users.where({
      userId_in: ids,
    });
  },
  resolver: keyResolver("id"),
  scheduler: windowScheduler(10),
});

const useUser = (id: number) => {
  return useQuery(["users", id], async () => {
    return users.fetch(id);
  });
};

const UserDetails = (props: { userId: number }) => {
  const { isFetching, data } = useUser(props.userId);
  return (
    <>
      {isFetching ? (
        <div>Loading user {props.userId}</div>
      ) : (
        <div>User: {data.name}</div>
      )}
    </>
  );
};

/**
 * Since all user details items are rendered within the window there will only be one request made.
 */
const UserList = () => {
  const userIds = [1, 2, 3, 4];
  return (
    <>
      {userIds.map((id) => (
        <UserDetails userId={id} />
      ))}
    </>
  );
};
```

### Fetching where response is an object of items

In this example the response is an object/record with the id of the user as the key and the user object as the value.

**Example:**
```json
{
  "1": {"username": "bob"},
  "2": {"username": "alice"}
}
```

```ts
import * as batshit from "@yornaath/batshit";

const batcher = batshit.create({
  fetcher: async (ids: number[]) => {
    const users: Record<number, User> = await fetchUserRecords(ids)
    return users
  },
  resolver: batshit.indexedResolver(),
});
```

### Fethcing with needed context

If the batch fetcher needs some context like an sdk or client to make its fetching you can use a memoizer to make sure that you reuse a batcher for the given context in the hook calls.

```ts
import { useQuery } from "@tanstack/react-query";
import { memoize } from "lodash-es";
import * as batshit from "@yornaath/batshit";

export const key = "markets";

const batcher = memoize((sdk: Sdk<IndexerContext>) => {
  return batshit.create({
    name: key,
    fetcher: async (ids: number[]) => {
      const { markets } = await sdk.markets({
        where: {
          marketId_in: ids,
        },
      });
      return markets;
    },
    scheduler: batshit.windowScheduler(10),
    resolver: batshit.keyResolver("marketId"),
  });
});

export const useMarket = (marketId: number) => {
  const [sdk, id] = useSdk();

  const query = useQuery(
    [id, key, marketId],
    async () => {
      if(sdk) {
        return batcher(sdk).fetch(marketId);
      }
    },
    {
      enabled: Boolean(sdk),
    },
  );

  return query;
};
```

# Custom Batch Resolver

This batcher will fetch all posts for multiple users in one request and resolve the correct list of posts for the discrete queries.

```ts
const userposts = create({
  fetcher: async (queries: { authorId: number }) => {
    return api.posts.where({
      authorId_in: queries.map((q) => q.authorId),
    });
  },
  scheduler: windowScheduler(10),
  resolver: (posts, query) =>
    posts.filter((post) => post.authorId === query.authorId),
});

const [alicesPosts, bobsPost] = await Promise.all([
  userposts.fetch({authorId: 1})
  userposts.fetch({authorId: 2})
]);
```

# React Devtools

Tools to debug and inspect the batching process can be found in the [@yornaath/batshit-devtools-react](https://www.npmjs.com/package/@yornaath/batshit-devtools-react) package.

```bash
yarn add @yornaath/batshit-devtools @yornaath/batshit-devtools-react
```

```ts
import { create, keyResolver, windowScheduler } from "@yornaath/batshit";
import BatshitDevtools from "@yornaath/batshit-devtools-react";

const batcher = create({
  fetcher: async (queries: number[]) => {...},
  scheduler: windowScheduler(10),
  resolver: keyResolver("id"),
  name: "batcher:data" // used in the devtools to identify a particular batcher.
});

const App = () => {
  <div>
    <BatshitDevtools />
  </div>
}
```
