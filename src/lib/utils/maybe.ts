export abstract class Maybe<T> {
  abstract bind<U>(f: (value: T) => Maybe<U>): Maybe<U>;
}

export class Just<T> extends Maybe<T> {
  constructor(private value: T) {
    super();
  }

  bind<U>(f: (value: T) => Maybe<U>): Maybe<U> {
    return f(this.value);
  }
}

export class Nothing<T> extends Maybe<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bind<U>(_f: (value: T) => Maybe<U>): Maybe<U> {
    return new Nothing<U>();
  }
}
