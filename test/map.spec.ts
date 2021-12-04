import { expect } from 'chai';
import * as P from '../src/index.js';

describe('P.map', () => {
  function mapper(value: number): number {
    return value * 10;
  }

  async function defferredMapper(value: number): Promise<number> {
    await P.sleep(4);
    return value * 10;
  }

  describe('Iterable', () => {
    it('should map input values array', async () => {
      const input = [1, 2, 3, 4];
      const output = await P.map(input, mapper);
      expect(output).to.deep.equal([10, 20, 30, 40]);
    });

    it('should map input promises array', async () => {
      const input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3), Promise.resolve(4)];
      const output = await P.map(input, mapper);
      expect(output).to.deep.equal([10, 20, 30, 40]);
    });

    it('should map mixed input array', async () => {
      const input = [1, Promise.resolve(2), 3, Promise.resolve(4)];
      const output = await P.map(input, mapper);
      expect(output).to.deep.equal([10, 20, 30, 40]);
    });

    it('should map input when mapper returns a promise', async () => {
      const input = [1, 2, 3, 4];
      const output = await P.map(input, defferredMapper);
      expect(output).to.deep.equal([10, 20, 30, 40]);
    });

    it('should call mapper asynchronously on values array', async () => {
      let calls = 0;
      function mapper(val: number): number {
        calls++;
        return val * 10;
      }

      const input = [1, 2, 3, 4];
      const promise = P.map(input, mapper);
      expect(calls).to.equal(0);
      const output = await promise;
      expect(calls).to.equal(4);
      expect(output).to.deep.equal([10, 20, 30, 40]);
    });

    it('should throw a TypeError when input is not iterable', async () => {
      let err: unknown;
      let output: number[];
      try {
        output = await P.map({} as any as number[], mapper);
      } catch (e) {
        err = e;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(output!).to.be.undefined;
      expect(err).to.be.instanceof(TypeError);
    });

    it('should reject when input contains rejection', async () => {
      const input = [1, Promise.resolve(2), Promise.reject(new Error('3')), 4];
      let err: unknown;
      let output: number[];
      try {
        output = await P.map(input, mapper);
      } catch (e) {
        err = e;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(output!).to.be.undefined;
      expect(err).to.be.instanceof(Error);
    });

    describe('with concurrency', () => {
      const options = { concurrency: 2 };

      it('should map input values array with concurrency', async () => {
        const input = [1, 2, 3, 4];
        const output = await P.map(input, mapper, options);
        expect(output).to.deep.equal([10, 20, 30, 40]);
      });

      it('should map input promises array with concurrency', async () => {
        const input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3), Promise.resolve(4)];
        const output = await P.map(input, mapper, options);
        expect(output).to.deep.equal([10, 20, 30, 40]);
      });

      it('should map input when mapper returns a promise with concurrency', async () => {
        const input = [1, 2, 3, 4];
        const output = await P.map(input, defferredMapper, options);
        expect(output).to.deep.equal([10, 20, 30, 40]);
      });

      it('should not have more than concurrency promises in flight', async () => {
        const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const r: number[] = [];

        const immediates: Array<[P.Defer<number>, number]> = [];
        const immediate = (index: number): Promise<number> => {
          const ret = P.defer<number>();
          immediates.push([ret, index]);
          return ret;
        };

        const lates: Array<[P.Defer<number>, number]> = [];
        const late = (index: number): Promise<number> => {
          const ret = P.defer<number>();
          lates.push([ret, index]);
          return ret;
        };

        const ret = P.map(input, async (v: number, i: number) => {
          if (i < 5) {
            await immediate(i);
          } else {
            await late(i);
          }
          r.push(v);
        }, { concurrency: 5 });

        await P.sleep(100);
        expect(r.length).to.equal(0);
        immediates.forEach(it => it[0].resolve(it[1]));

        await P.sleep(100);
        expect(r).to.deep.equal([0, 1, 2, 3, 4]);
        lates.forEach(it => it[0].resolve(it[1]));

        await P.sleep(100);
        expect(r).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        lates.forEach(it => it[0].resolve(it[1]));

        await ret;
        expect(r).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });
    });
  });

  describe('AsyncIterator', () => {
    let input!: AsyncIterable<number>;
    beforeEach(() => {
      input = {
        async* [Symbol.asyncIterator](): AsyncGenerator<number> {
          yield 1;
          yield 2;
          yield 3;
          yield 4;
        }
      };
    });

    it('should map input values asyncIterable', async () => {
      const output = await P.map(input, mapper);
      expect(output).to.deep.equal([10, 20, 30, 40]);
    });

    it('should map input when mapper returns a promise', async () => {
      const output = await P.map(input, defferredMapper);
      expect(output).to.deep.equal([10, 20, 30, 40]);
    });
  });
});
