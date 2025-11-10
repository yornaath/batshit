import { setTimeout } from "node:timers/promises";
export type User = {
  id: number;
  name: string;
};

export const users: User[] = [
  { id: 1, name: "Bob" },
  { id: 2, name: "Alice" },
  { id: 3, name: "Sally" },
  { id: 4, name: "John" },
  { id: 5, name: "Tim" },
];

export type Post = {
  id: number;
  title: string;
  authorId: number;
};

export const posts: Post[] = [
  { id: 1, title: "Hello", authorId: 1 },
  { id: 2, title: "World", authorId: 1 },
  { id: 3, title: "Hello", authorId: 2 },
  { id: 4, title: "World", authorId: 2 },
  { id: 5, title: "Hello", authorId: 3 },
  { id: 6, title: "World", authorId: 3 },
];

export const usersByIds = async (ids: number[]) => {
  return users.filter((item) => ids.includes(item.id));
};

export const usersByIdsAsync = async (ids: number[], delay: number, abortSignal: AbortSignal) => {
  await setTimeout(delay);
  if (abortSignal.aborted) {
    throw new Error("Aborted");
  }
  return users.filter((item) => ids.includes(item.id));
};

export const postsByAuthorId = async (authorIds: number[]) => {
  return Object.values(posts).filter((item) =>
    authorIds.includes(item.authorId)
  );
};


export let bigUserList: User[] = [];

export const BIG_USER_LIST_LENGTH = 30000;

for (let i = 1; i <= BIG_USER_LIST_LENGTH; i++) {
  bigUserList.push({ id: i, name: `User ${i}` });
}

export const bigUserById = async (ids: number[]) => {
  return bigUserList.filter((item) => ids.includes(item.id));
};