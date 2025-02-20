import { filter, forkJoin, map, materialize, Observable } from 'rxjs';
import { PromiseAllSources, PromiseAllOutput, PromiseAllItemFulfilled, PromiseAllStatus, PromiseAllItemRejected } from './types';

export function forkJoinSettled<TInput extends any[] = []>(sources: PromiseAllSources<TInput>): Observable<PromiseAllOutput<TInput>> {
  const observables = sources
    .map(source => source
      .pipe(
        materialize(),
        filter(notification => notification.kind !== 'C'),
        map(notification => {
          switch (notification.kind) {
            case 'N': {
              return <PromiseAllItemFulfilled<typeof notification.value>>{
                status: PromiseAllStatus.Fulfilled,
                value: notification.value
              }
            }
            case 'E': {
              return <PromiseAllItemRejected>{
                status: PromiseAllStatus.Rejected,
                reason: notification.error
              }
            }
          }
        })
      )
    );

  return <Observable<PromiseAllOutput<TInput>>>forkJoin(observables);
}


