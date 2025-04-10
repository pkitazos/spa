// N.B.: this file is necessary to avoid circular imports. Mess with at your peril!
// You must only import the modules herein from this file - otherwise stuff *will* break.
// for details of how/why this works, see this arcane bit of lore:
// https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de

// the basic rule: Define (i.e. import) the superclass *before* its children

// define user first
export { User } from "./user";

export { Student } from "./student";

export { SuperAdmin } from "./super-admin";
export { GroupAdmin } from "./group-admin";
export { SubGroupAdmin } from "./sub-group-admin";

// define marker before reader or supervisor (its subclasses)
export { Marker } from "./marker";
export { Reader } from "./reader";
export { Supervisor } from "./supervisor";
