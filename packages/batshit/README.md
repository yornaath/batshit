# @yornaath/batshit [![CI](https://github.com/yornaath/batshit/actions/workflows/ci.yml/badge.svg)](https://github.com/yornaath/batshit/actions/workflows/ci.yml)

A batch manager that will deduplicate and batch requests for a certain data type made within a window.

## Quickstart

```ts
import { Batcher, windowScheduler } from "@yornaath/batshit";

let fetchCalls = 0;

type User = { id: number; name: string };

const users = Batcher<User, number>({
  fetcher: async (ids) => {
    fetchCalls++;
    return client.users.where({
      userId_in: ids,
    });
  },
  equality: "id",
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

```ts
import { useQuery } from "react-query";
import { Batcher, windowScheduler } from "@yornaath/batshit";

const users = Batcher<User, number>({
  fetcher: async (ids) => {
    return client.users.where({
      userId_in: ids,
    });
  },
  equality: "id",
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
