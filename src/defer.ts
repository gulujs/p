export interface DeferOptions {
  throwErrorWhenResovledMultipleTimes: boolean;
}

class Defer<T> implements Promise<T> {
  private readonly _throwErrorWhenResovledMultipleTimes: boolean;
  private readonly _promise: Promise<T>;
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason?: unknown) => void;
  private _isPending = true;
  private _isFulfilled = false;
  private _isRejected = false;

  private _value?: T;
  private _reason?: unknown;

  readonly [Symbol.toStringTag] = 'Defer';

  get isPending(): boolean {
    return this._isPending;
  }

  get isFulfilled(): boolean {
    return this._isFulfilled;
  }

  get isRejected(): boolean {
    return this._isRejected;
  }

  get value(): T | undefined {
    return this._value;
  }

  get reason(): unknown {
    return this._reason;
  }

  constructor(options: DeferOptions) {
    this._throwErrorWhenResovledMultipleTimes = options.throwErrorWhenResovledMultipleTimes;
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  resolve(value: T): void {
    if (!this._isPending) {
      if (this._throwErrorWhenResovledMultipleTimes) {
        throw new Error(`It is already ${this._isFulfilled ? 'fulfilled' : 'rejected'}`);
      }
      return;
    }

    this._value = value;
    this._isPending = false;
    this._isFulfilled = true;
    this._resolve(value);
  }

  reject(reason?: unknown): void {
    if (!this._isPending) {
      if (this._throwErrorWhenResovledMultipleTimes) {
        throw new Error(`It is already ${this._isFulfilled ? 'fulfilled' : 'rejected'}`);
      }
      return;
    }

    this._reason = reason;
    this._isPending = false;
    this._isRejected = true;
    this._reject(reason);
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null): Promise<T | TResult> {
    return this._promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<T> {
    return this._promise.finally(onfinally);
  }
}

export function defer<T>(options: DeferOptions = { throwErrorWhenResovledMultipleTimes: false }): Defer<T> {
  return new Defer<T>(options);
}

export type { Defer };
