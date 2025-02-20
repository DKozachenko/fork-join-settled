import { Observable } from 'rxjs';

export enum PromiseAllStatus {
  Fulfilled = 'fulfilled',
  Rejected = 'rejected',
}

export interface PromiseAllItemBase {
  status: PromiseAllStatus;
}

export interface PromiseAllItemFulfilled<T = unknown> extends PromiseAllItemBase {
  status: PromiseAllStatus.Fulfilled;
  value: T;
}

export interface PromiseAllItemRejected extends PromiseAllItemBase {
  status: PromiseAllStatus.Rejected;
  reason: Error;
}

export type PromiseAllItem<T> = PromiseAllItemFulfilled<T> | PromiseAllItemRejected;

export type PromiseAllSources<TInput extends unknown[]> = {
  [Key in keyof TInput]: Observable<TInput[Key]>;
};

export type PromiseAllOutput<TInput extends unknown[]> = {
  [Key in keyof TInput]: PromiseAllItem<TInput[Key]>;
};
