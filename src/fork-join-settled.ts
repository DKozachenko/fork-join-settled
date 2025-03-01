import { filter, forkJoin, map, materialize, Observable } from 'rxjs';

export type PromiseAllSources<TInput extends unknown[]> = {
  [Key in keyof TInput]: Observable<TInput[Key]>;
};

export type PromiseAllOutput<TInput extends unknown[]> = {
  [Key in keyof TInput]: PromiseSettledResult<TInput[Key]>;
};

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
              status: 'fulfilled',
              value: notification.value,
            } as PromiseFulfilledResult<typeof notification.value>;
          }
          case 'E': {
            return {
              status: 'rejected',
              reason: notification.error,
            } as PromiseRejectedResult;
          }
        }
      }),
    ),
  );

  return forkJoin(observables) as Observable<PromiseAllOutput<TInput>>;
}
