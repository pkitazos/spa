export type User = { id: string; name: string; email: string };

export type Session = { user: User | null };
