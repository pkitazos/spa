# Style guide

## Destructing

In async functions, you should destructure values before returning them. For example, do this:

> [!tip] OK:
>
> ```ts
> const { parentInstanceId } = await instance.get();
> return parentInstanceId;
> ```

Not this:

> [!tip] BAD:
>
> ```ts
> return (await instance.get()).parentInstanceId;
> ```

You don't have to do this if you don't need the await. For example:

> [!tip] OK:
>
> ```ts
> return instance.params;
> ```
