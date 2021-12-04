class MappingPromiseArray<T, U> {
  private readonly concurrency: number;

  private readonly result: U[] = [];
  private resolve?: (value: U[]) => void;
  private reject?: (reason: unknown) => void;

  private i = 0;
  private running = 0;
  private rejected = false;
  private fulfilled = false;

  private readonly iterator?: Iterator<T | Promise<T>> | AsyncIterator<T>;

  constructor(
    items: Iterable<T | Promise<T>> | AsyncIterable<T>,
    private readonly mapper: (item: T, index: number) => U | Promise<U>,
    options?: { concurrency: number; }
  ) {
    this.concurrency = (options && options.concurrency > 0)
      ? options.concurrency
      : Number.POSITIVE_INFINITY;

    if (typeof (items as Iterable<T>)[Symbol.iterator] !== 'undefined') {
      this.iterator = (items as Iterable<T | Promise<T>>)[Symbol.iterator]();

    } else if (typeof (items as AsyncIterable<T>)[Symbol.asyncIterator] !== 'undefined') {
      this.iterator = (items as AsyncIterable<T>)[Symbol.asyncIterator]();
    }
  }

  promise(): Promise<U[]> {
    return new Promise((resolve, reject) => {
      if (!this.iterator) {
        throw new TypeError('items is not iterable');
      }

      this.resolve = resolve;
      this.reject = reject;
      this.start();
    });
  }

  private start(n = 0): void {
    if (n === this.concurrency) {
      return;
    }

    void Promise.resolve(this.iterator!.next())
      .then((item) => {
        if (item.done || this.rejected) {
          return;
        }
        void this.convert(item.value, this.i++);
        this.start(n + 1);
      });
  }

  private async convert(value: T | Promise<T>, i: number): Promise<void> {
    this.running++;
    try {
      this.result[i] = await this.mapper(await value, i);
    } catch (e) {
      this.rejected = true;
      this.reject!(e);
    }
    this.running--;

    if (this.rejected) {
      return;
    }

    const item = await this.iterator!.next();
    if (item.done) {
      if (this.running === 0 && !this.fulfilled) {
        this.fulfilled = true;
        this.resolve!(this.result);
      }
      return;
    }

    void this.convert(item.value, this.i++);
  }
}

export function map<T, U>(
  items: Iterable<T | Promise<T>> | AsyncIterable<T>,
  mapper: (item: T, index: number) => U | Promise<U>,
  options?: { concurrency: number; }
): Promise<U[]> {
  return new MappingPromiseArray<T, U>(items, mapper, options).promise();
}
