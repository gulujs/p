# @lunjs/p

## Installation

```sh
npm install @lunjs/p
```

## Usage

- `defer()`

```js
import * as P from '@lunjs/p';

const deferred = P.defer();
(async () => {
  const r = await deferred;
  console.log(r);
})();
deferred.resolve('Hello world!');
```

- `map(items, mapper, options)`

```js
import * as P from '@lunjs/p';

(async () => {
  const r = P.map([1, 2, 3], async (v) => { return v * 10; }, { concurrency: 2 });
  console.log(r);
})();
```

- `queue(worker, concurrency)`

```js
import * as P from '@lunjs/p';

const q = P.queue(async (task) => { return task * 10; }, 2);

(async () => {
  const r = await q.push(1);
  console.log(r);
})();
```

- `sleep(ms)`

```js
import * as P from '@lunjs/p';

(async () => {
  console.log(1);
  await P.sleep(1000);
  console.log(2);
})();
```

## License

[MIT](LICENSE)

