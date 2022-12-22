# batshit

A batch manager that will batch requests for a certain data type within a given window.

## Quickstart

```ts
import { Batcher, windowScheduler } from "batshit"

let fetchCalls = 0

type User = { id: number, name: string }

const users = Batcher<User, "id">({
  idKey: "id",
  fetcher: async (ids) => {
    fetchCalls++
    return client.users.where({
      userId_in: ids
    })
  },
  scheduler: windowScheduler(10) // Default and can be omitted.
})

/**
 * Requests will be batched to one call since they are done within the same time window of 10 ms. 
 */
const bob = users.get(1)
const alice = users.get(2)

const bobUndtAlice = await Promise.all([bob, alice])

await delay(100)

/**
 * New Requests will be batched in a another call since not within the timeframe.
 */
const joe = users.get(3)
const margareth = users.get(4)

const joeUndtMargareth = await Promise.all([ joe, margareth ])

fetchCalls === 2

```

## React(query) Example

Using the same users manager in the above example.

```ts
import { useQuery } from "react-query"

const useUser = (id: number) => {
  return useQuery([ "users", id ], async () => {
    return users.get(id)
  })
}

const UserDetails = (props: {userId: number}) => {
  const {isFetching, data} = useUser(props.userId)
  return <>
    {
      isFetching ? 
        <div>Loading user {props.userId}</div> 
      : 
        <div>
          User: {data.name}
        </div>
    }
  </>
}

/**
 * Since all user details items are rendered within the window there will only be one request made.
 */
const UserList = () => {
  const userIds = [1,2,3,4]
  return <>
    {
      userIds.map(id => <UserDetails userId={id} />)
    }
  </>
}

```
