import { Role } from "@/db/types";

/**
 * @deprecated define users as env variable instead
 */
export const testUserEmails = [
  { ord: 0, email: "petros.kitazos@glasgow.ac.uk", roles: [Role.ADMIN] },
  { ord: 0, email: "j.trevor.1@research.gla.ac.uk", roles: [Role.ADMIN] },
  { ord: 1, email: "johnh.williamson@glasgow.ac.uk", roles: [Role.ADMIN] },
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
  { ord: 6, email: "craig.macdonald@glasgow.ac.uk", roles: [Role.READER] },
  { ord: 7, email: "2084268d@student.gla.ac.uk", roles: [Role.STUDENT] },
];
