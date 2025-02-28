import { describe, expect, test } from '@jest/globals';
import { cold, hot } from 'jest-marbles';
import { ColdObservable } from 'jest-marbles/dist/typings/src/rxjs/cold-observable';
import { forkJoinSettled } from './fork-join-settled';
import { PromiseAllItem, PromiseAllStatus } from './types';

function generateOutputValue(inputValues: any[]): PromiseAllItem<any>[] {
  return inputValues.map((item: any) => {
    if (item instanceof Error) {
      return {
        status: PromiseAllStatus.Rejected,
        reason: item
      }
    }

    return {
      status: PromiseAllStatus.Fulfilled,
      value: item
    }
  });
}

function generateSingleEmittedObservables(inputValues: (any | Error)[], frames: string[] = []): ColdObservable[] {
  return inputValues.map((inputValue: any | Error, index: number) => {
    if (inputValue instanceof Error) {
      return cold(`${frames[index] ?? ''}#`, null, inputValue);
    }
    return cold(`${frames[index] ?? ''}a|`, { a: inputValue });
  });
}

describe('fork-join-settled', () => {
  describe.each([
    [cold],
    [hot],
  ])('%p observables', (observableType) => {
    test('if sources are empty it should complete immediately', () => {
      const actualObservable = forkJoinSettled([]);
      const expectedObservable = observableType('|');

      expect(actualObservable).toBeObservable(expectedObservable);
    });

    describe('single emitted value', () => {
      describe('completed successfully', () => {
        test.each([
          [[5]],
          [[5, 'test']],
          [[5, 'test', true]],
          [[5, 'test', true, { prop: 'value' }]],
          [[5, 'test', true, { prop: 'value' }, [1, 2, 3, 4]]],
        ])('if sources (%j) are completed successfully it should complete with fulfield items', (inputValues: any[]) => {
          const sources = generateSingleEmittedObservables(inputValues);

          const actualObservable = forkJoinSettled(sources);
          const expectedObservable = observableType('-(a|)', { a: generateOutputValue(inputValues) });

          expect(actualObservable).toBeObservable(expectedObservable);
        });

        test('if sources are completed without errors with same delay it should complete with fulfield items after this delay', () => {
          const FRAME_LENGTH = '-';
          const inputValues = [5, 'test', true, { prop: 'value' }, [1, 2, 3, 4]];
          const frames = Array(inputValues.length).fill(FRAME_LENGTH);
          const sources = generateSingleEmittedObservables(inputValues, frames);

          const actualObservable = forkJoinSettled(sources);
          const expectedObservable = observableType(`${FRAME_LENGTH}-(a|)`, { a: generateOutputValue(inputValues) });

          expect(actualObservable).toBeObservable(expectedObservable);
        });

        test('if sources are completed without errors with different delay it should complete with fulfield items after longest delay', () => {
          const inputValues = [5, 'test', true, { prop: 'value' }, [1, 2, 3, 4]];
          const frames = ['', '--', '-', '', '---'];
          const longestFrameLength = Math.max(...frames.map(frame => frame.length));
          const sources = generateSingleEmittedObservables(inputValues, frames);

          const actualObservable = forkJoinSettled(sources);
          const expectedObservable = observableType(`${'-'.repeat(longestFrameLength)}-(a|)`, { a: generateOutputValue(inputValues) });

          expect(actualObservable).toBeObservable(expectedObservable);
        });
      });

      describe('with errors', () => {
        test.each([
          [[new Error('error 1')]],
          [[new Error('error 1'), new Error('error 2')]],
          [[new Error('error 1'), new Error('error 2'), new Error('error 3')]],
        ])('if sources (%p) are with errors it should complete with rejected items', (inputValues: Error[]) => {
          const sources = generateSingleEmittedObservables(inputValues);

          const actualObservable = forkJoinSettled(sources);
          const expectedObservable = observableType('(a|)', { a: generateOutputValue(inputValues) });

          expect(actualObservable).toBeObservable(expectedObservable);
        });

        test('if sources are with errors with same delay it should complete with rejected items after this delay', () => {
          const FRAME_LENGTH = '-';
          const inputValues = [new Error('error 1'), new Error('error 2'), new Error('error 3')];
          const frames = Array(inputValues.length).fill(FRAME_LENGTH);
          const sources = generateSingleEmittedObservables(inputValues, frames);

          const actualObservable = forkJoinSettled(sources);
          const expectedObservable = observableType(`${FRAME_LENGTH}(a|)`, { a: generateOutputValue(inputValues) });

          expect(actualObservable).toBeObservable(expectedObservable);
        });

        test('if sources are with errors with different delay it should complete with rejected items after longest delay', () => {
          const inputValues = [new Error('error 1'), new Error('error 2'), new Error('error 3')];
          const frames = ['', '--', '-'];
          const longestFrameLength = Math.max(...frames.map(frame => frame.length));
          const sources = generateSingleEmittedObservables(inputValues, frames);

          const actualObservable = forkJoinSettled(sources);
          const expectedObservable = observableType(`${'-'.repeat(longestFrameLength)}(a|)`, { a: generateOutputValue(inputValues) });

          expect(actualObservable).toBeObservable(expectedObservable);
        });
      })

      describe('combined cases', () => {
        test('if sources are combined (completed successfully and with errors both) it should complete with combined items', () => {
          const inputValues = [5, 'test', true, new Error('error 1'), { prop: 'value' }, [1, 2, 3, 4], new Error('error 2')];
          const sources = generateSingleEmittedObservables(inputValues);

          const actualObservable = forkJoinSettled(sources);
          const expectedObservable = observableType(`-(a|)`, { a: generateOutputValue(inputValues) });

          expect(actualObservable).toBeObservable(expectedObservable);
        });
      });
    })

    describe('multiple emitted values', () => {
      describe('completed successfully', () => {
        test('if sources are completed successfully it should complete with lastest fulfield items', () => {
          const obs1 = observableType(`-a-|`, { a: 5 });
          const obs2 = observableType(`-a-b|`, { a: 5, b: 'test' });
          const obs3 = observableType(`-a-b-c--|`, { a: 5, b: 'test', c: true });
          const obs4 = observableType(`a|`, { a: { prop: 'value' } });
          const obs5 = observableType(`a---b|`, { a: { prop: 'value' }, b: [1, 2, 3, 4] });
          const sources = [obs1, obs2, obs3, obs4, obs5];

          const longestMarbles = Math.max(...sources.map(obs => obs.marbles.replace('|', '').length));
          const latestValues = [5, 'test', true, { prop: 'value' }, [1, 2, 3, 4]];

          const actualObservable = forkJoinSettled(sources);
          const expectedObservable = observableType(`${'-'.repeat(longestMarbles)}(a|)`, { a: generateOutputValue(latestValues) });

          expect(actualObservable).toBeObservable(expectedObservable);
        });
      });


      describe('with errors', () => {
        test('if sources are completed with errors it should complete with lastest rejected items', () => {
          const obs1 = observableType(`-a-#`, { a: 5 }, new Error('error 1'));
          const obs2 = observableType(`-a-b-#`, { a: 5, b: 'test' }, new Error('error 2'));
          const obs3 = observableType(`-a-b-c--#`, { a: 5, b: 'test', c: true }, new Error('error 3'));
          const obs4 = observableType(`a#`, { a: { prop: 'value' } }, new Error('error 4'));
          const obs5 = observableType(`a---b#`, { a: { prop: 'value' }, b: [1, 2, 3, 4] }, new Error('error 5'));
          const sources = [obs1, obs2, obs3, obs4, obs5];

          const longestMarbles = Math.max(...sources.map(obs => obs.marbles.replace('#', '').length));
          const latestValues = [new Error('error 1'), new Error('error 2'), new Error('error 3'), new Error('error 4'), new Error('error 5')];

          const actualObservable = forkJoinSettled(sources);
          const expectedObservable = observableType(`${'-'.repeat(longestMarbles)}(a|)`, { a: generateOutputValue(latestValues) });

          expect(actualObservable).toBeObservable(expectedObservable);
        });
      });

      describe('combined cases', () => {
        test('if sources are combined (completed successfully and with errors both) it should complete with lastest rejected items (fulfield and rejected respectively)', () => {
          const obs1 = observableType(`-a--|`, { a: 5 });
          const obs2 = observableType(`-a-b|`, { a: 5, b: 'test' });
          const obs3 = observableType(`-a-b--#`, { a: 5, b: 'test' }, new Error('error 1'));
          const obs4 = observableType(`a|`, { a: { prop: 'value' } });
          const obs5 = observableType(`a-b-c|`, { a: { prop: 'value' }, b: true, c: [1, 2, 3, 4] });
          const obs6 = observableType(`a-b-#`, { a: { prop: 'value' }, b: [1, 2, 3, 4] }, new Error('error 2'));
          const sources = [obs1, obs2, obs3, obs4, obs5, obs6];

          const longestMarbles = Math.max(...sources.map(obs => obs.marbles.replace('|', '').replace('#', '').length));
          const latestValues = [5, 'test', new Error('error 1'), { prop: 'value' }, [1, 2, 3, 4], new Error('error 2')];

          const actualObservable = forkJoinSettled(sources);
          const expectedObservable = observableType(`${'-'.repeat(longestMarbles)}(a|)`, { a: generateOutputValue(latestValues) });

          expect(actualObservable).toBeObservable(expectedObservable);
        });
      });
    });
  });
});
