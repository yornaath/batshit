# @yornaath/batshit [![CI](https://github.com/yornaath/batshit/actions/workflows/ci.yml/badge.svg)](https://github.com/yornaath/batshit/actions/workflows/ci.yml)

A batch manager that will deduplicate and batch requests for a given data type made within a window of time (or other custom scheduling). Useful to batch requests made from multiple react components that uses react-query or do batch processing of accumulated tasks.

### Codesandbox example
Here is a codesanbox example using react, typescript, vite and the zeitgeist prediction-markets indexer api.
It fetches markets up front and then batches all liquidity pool fetches made from the individual components into one request.

[Codesandbox](https://codesandbox.io/s/yornaath-batshit-example-8f8q3w?file=/src/App.tsx)

### Example with devtools
Example using zeitgeist market and pool data with included devtools to inspect the batching process.
The example code can be found in [./packages/example](https://github.com/yornaath/batshit/tree/master/packages/example)

[Vercel Example app](https://batshit-example.vercel.app/)

## Quickstart

Here we are creating a simple batcher that will batch all fetches made within a window of 10 ms into one request.

```ts
import { Batcher, keyResolver, windowScheduler } from "@yornaath/batshit";

let fetchCalls = 0;

type User = { id: number; name: string };

const users = Batcher<User, number>({
  fetcher: async (ids) => {
    fetchCalls++;
    return client.users.where({
      userId_in: ids,
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

fetchCalls === 1;

await delay(100);

/**
 * New Requests will be batched in a another call since not within the timeframe.
 */
const joe = users.fetch(3);
const margareth = users.fetch(4);

const joeUndtMargareth = await Promise.all([joe, margareth]);

fetchCalls === 2;
```

## React(query) Example

Here we are also creating a simple batcher that will batch all fetches made within a window of 10 ms into one request since all UserItem components will be rendered and most likely make their queries within the same window of 10 ms.

```ts
import { useQuery } from "react-query";
import { Batcher, windowScheduler } from "@yornaath/batshit";

const users = Batcher<User, number>({
  fetcher: async (ids) => {
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

# Custom Batch Resolver

This batcher will fetch all posts for multiple users in one request and resolve the correct list of posts for the discrete queries.

```ts
const userposts = create<mock.Post, { authorId: number }, mock.Post[]>({
  fetcher: async (queries) => {
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
