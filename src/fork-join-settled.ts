import { filter, forkJoin, map, materialize, Observable } from 'rxjs';
import {
  PromiseAllSources,
  PromiseAllOutput,
  PromiseAllStatus,
  PromiseAllItemFulfilled,
  PromiseAllItemRejected,
} from './types';

export function forkJoinSettled<TInput extends unknown[] = []>(
  sources: PromiseAllSources<TInput>,
): Observable<PromiseAllOutput<TInput>> {
  const observables = sources.map((source) =>
    source.pipe(
      materialize(),
      filter((notification) => notification.kind !== 'C'),
      map((notification) => {
        switch (notification.kind) {
          case 'N': {
            return {
              status: PromiseAllStatus.Fulfilled,
              value: notification.value,
            } as PromiseAllItemFulfilled<typeof notification.value>;
          }
          case 'E': {
            return {
              status: PromiseAllStatus.Rejected,
              reason: notification.error,
            } as PromiseAllItemRejected;
          }
        }
      }),
    ),
  );

  return forkJoin(observables) as Observable<PromiseAllOutput<TInput>>;
}
