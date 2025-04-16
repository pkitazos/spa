export const testers = [
  {
    guid: "2579354t",
    email: "j.trevor.1@research.gla.ac.uk",
    name: "Jake Trevor",
  },

  { guid: "phh9g", name: "Paul Harvey", email: "paul.harvey@glasgow.ac.uk" },
  {
    guid: "ig73b",
    name: "Yiannis Giannakopoulos",
    email: "yiannis.giannakopoulos@glasgow.ac.uk",
  },
  {
    guid: "ds267f",
    name: "Derek Somerville",
    email: "Derek.Somerville@glasgow.ac.uk",
  },
  {
    guid: "lmb25w",
    name: "Lewis Brennan",
    email: "Lewis.Brennan@glasgow.ac.uk",
  },
  {
    guid: "bk79c",
    name: "Brishketu Kislay",
    email: "Brishketu.Kislay@glasgow.ac.uk",
  },

  { guid: "mjb24v", name: "Matthew Barr", email: "Matthew.Barr@glasgow.ac.uk" },
  {
    guid: "sd323v",
    name: "Sayonee Dassani",
    email: "Sayonee.Dassani@glasgow.ac.uk",
  },
];

export const testWhitelist = testers.map((e) => e.guid);
// [
//   "lmb25w",
//   "ig73b",
//   "phh9g",
//   "ds267f",
//   "2579354t",
//   "mjb24v",
//   "tws3r",
// ];

export const liveWhitelist = ["lmb25w", "ig73b", "phh9g", "2579354t"];
