import { describe, expect, test } from '@jest/globals';
import { cold } from 'jest-marbles';
import { ColdObservable } from 'jest-marbles/dist/typings/src/rxjs/cold-observable';
import { forkJoinSettled } from './fork-join-settled';
import { PromiseAllItem, PromiseAllStatus } from './types';

function generateResultValue(inputValues: any[]): PromiseAllItem<any>[] {
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
  return inputValues.map((item: any, index: number) => {
    if (item instanceof Error) {
      return cold(`${frames[index] ?? ''}#`, null, item);
    }
    return cold(`${frames[index] ?? ''}a|`, { a: item });
  });
}

  // combined valid and error values (2-5)
// observable with multiple emitted values
  // multiple valid values (2-5)
  // multiple valid values with delay
  // multiple error values (2-5)
  // combined valid and error values (2-5)
describe('fork-join-settled', () => {
  describe('cold observables', () => {
    test('if sources are empty it should complete immediately', () => {
      const result = forkJoinSettled([]);

      expect(result).toBeObservable(cold('|'));
    });

    describe('single emitted value', () => {
      describe('completed successfully', () => {
        test.each([
          [[5]],
          [[5, 'test']],
          [[5, 'test', true]],
          [[5, 'test', true, { prop: 'value' }]],
          [[5, 'test', true, { prop: 'value' }, [1, 2, 3, 4]]],
        ])('if sources (%j) are completed without errors it should complete with fulfield items', (inputValues: any[]) => {
          const sources = generateSingleEmittedObservables(inputValues)
          const expectedResult = generateResultValue(inputValues);

          const result = forkJoinSettled(sources);

          expect(result).toBeObservable(cold('-(a|)', {
            a: expectedResult
          }));
        });

        test('if sources are completed without errors with same delay it should complete with fulfield items after this delay', () => {
          const FRAME_LENGTH = '-';
          const inputValues = [5, 'test', true, { prop: 'value' }, [1, 2, 3, 4]];
          const frames = Array(inputValues.length).fill(FRAME_LENGTH);
          const sources = generateSingleEmittedObservables(inputValues, frames);
          const expectedResult = generateResultValue(inputValues);

          const result = forkJoinSettled(sources);

          expect(result).toBeObservable(cold(`${FRAME_LENGTH}-(a|)`, {
            a: expectedResult
          }));
        });

        test('if sources are completed without errors with different delay it should complete with fulfield items after longest delay', () => {
          const inputValues = [5, 'test', true, { prop: 'value' }, [1, 2, 3, 4]];
          const frames = ['', '--', '-', '', '---'];
          const longestFrameLength = Math.max(...frames.map(frame => frame.length));
          const sources = generateSingleEmittedObservables(inputValues, frames);
          const expectedResult = generateResultValue(inputValues);

          const result = forkJoinSettled(sources);

          expect(result).toBeObservable(cold(`${'-'.repeat(longestFrameLength)}-(a|)`, {
            a: expectedResult
          }));
        });
      });

      describe('with errors', () => {
        test.each([
          [[new Error('error 1')]],
          [[new Error('error 1'), new Error('error 2')]],
          [[new Error('error 1'), new Error('error 2'), new Error('error 3')]],
        ])('if sources (%p) are with errors it should complete with rejected items', (inputValues: Error[]) => {
          const sources = generateSingleEmittedObservables(inputValues)
          const expectedResult = generateResultValue(inputValues);

          const result = forkJoinSettled(sources);

          expect(result).toBeObservable(cold('(a|)', {
            a: expectedResult
          }));
        });

        test('if sources are with errors with same delay it should complete with rejected items after this delay', () => {
          const FRAME_LENGTH = '-';
          const inputValues = [new Error('error 1'), new Error('error 2'), new Error('error 3')];
          const frames = Array(inputValues.length).fill(FRAME_LENGTH);
          const sources = generateSingleEmittedObservables(inputValues, frames);
          const expectedResult = generateResultValue(inputValues);

          const result = forkJoinSettled(sources);

          expect(result).toBeObservable(cold(`${FRAME_LENGTH}(a|)`, {
            a: expectedResult
          }));
        });

        test('if sources are with errors with different delay it should complete with rejected items after longest delay', () => {
          const inputValues = [new Error('error 1'), new Error('error 2'), new Error('error 3')];
          const frames = ['', '--', '-'];
          const longestFrameLength = Math.max(...frames.map(frame => frame.length));
          const sources = generateSingleEmittedObservables(inputValues, frames);
          const expectedResult = generateResultValue(inputValues);

          const result = forkJoinSettled(sources);

          expect(result).toBeObservable(cold(`${'-'.repeat(longestFrameLength)}(a|)`, {
            a: expectedResult
          }));
        });
      })
    });
  })
});

