import { Role } from "@/db/types";

export const testUserEmails = [
  { ord: 1, email: "william.pettersson@glasgow.ac.uk", roles: [Role.ADMIN] },
  {
    ord: 2,
    email: "yiannis.giannakopoulos@glasgow.ac.uk",
    roles: [Role.ADMIN, Role.SUPERVISOR],
  },
  {
    ord: 3,
    email: "paul.harvey@glasgow.ac.uk",
    roles: [Role.ADMIN, Role.READER],
  },
  { ord: 4, email: "gethin.norman@glasgow.ac.uk", roles: [Role.SUPERVISOR] },
  {
    ord: 5,
    email: "david.manlove@glasgow.ac.uk",
    roles: [Role.SUPERVISOR, Role.READER],
  },
  { ord: 6, email: "j.trevor.1@research.gla.ac.uk", roles: [Role.READER] },
  { ord: 7, email: "2526547k@student.gla.ac.uk", roles: [Role.STUDENT] },
];
