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

export const usersByIds = (ids: number[]) =>
  Object.values(users).filter((item) => ids.includes(item.id));

export const postsByAuthorId = (authorIds: number[]) =>
  Object.values(posts).filter((item) => authorIds.includes(item.authorId));
