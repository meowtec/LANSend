import produce, { Draft } from 'immer';
import { mapValues } from '#/utils/object';

export type Reducer<State, Payload> = (state: State, payload: Payload) => State;

export type MutateReducer<State, Payload> = (state: Draft<State>, payload: Payload) => void;

export type GetBoundReducer<E extends Reducer<any, any>> = E extends Reducer<any, infer P>
  ? (payload: P) => void
  : never;

export type GetBoundMutateReducer<E extends MutateReducer<any, unknown>> = E extends MutateReducer<any, infer P>
  ? (payload: P) => void
  : never;

export type Effect<Store extends StoreLike, Payload, RT> = (store: Store, payload: Payload) => RT;

export type GetBoundEffect<E> = E extends Effect<any, infer P, infer RT>
  ? (payload: P) => RT
  : never;

type StoreLike<State = any> = {
  setState: (produce: (state: State) => State) => void;
  getState: () => State;
};

/// just type inference for reducer
/// can be replaced by `satisfies` in the future
/// see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator
export function defineReducer<State, Payload= void>(e: Reducer<State, Payload>): Reducer<State, Payload> {
  return e;
}

/// type inference for reducer with specific state
export function createDefineReducerFor<State>() {
  return <Payload= void>(e: Reducer<State, Payload>) => defineReducer(e);
}

/// just type inference for mutate reducer
export function defineMutateReducer<State, Payload= void>(e: MutateReducer<State, Payload>): MutateReducer<State, Payload> {
  return e;
}

/// type inference for mutate reducer with specific state
export function createDefineMutateReducerFor<State>() {
  return <Payload= void>(e: MutateReducer<State, Payload>) => defineMutateReducer(e);
}

/// just type inference for effect
export function defineEffect<Store extends StoreLike, Payload = void, RT = void>(e: Effect<Store, Payload, RT>): Effect<Store, Payload, RT> {
  return e;
}

/// type inference for effect with specific store
export function createDefineEffectFor<Store extends StoreLike>() {
  return <Payload = void, RT = void>(e: Effect<Store, Payload, RT>) => defineEffect(e);
}

export function bindReducer<State, Payload>(reducer: Reducer<State, Payload>, store: StoreLike<State>) {
  return (payload: Payload) => store.setState((state) => reducer(state, payload));
}

export function bindMutateReducer<State, Payload>(reducer: MutateReducer<State, Payload>, store: StoreLike<State>, identifier: string | number | symbol) {
  return (payload: Payload) => {
    console.log(`dispatch ${String(identifier)}`, payload);
    store.setState((state) => produce(state, (draft) => reducer(draft, payload)));
  };
}

export type BoundReducers<State, Reducers extends Record<string, Reducer<State, unknown>>> = {
  [K in keyof Reducers]: GetBoundReducer<Reducers[K]>;
};

export type BoundMutateReducers<T, Reducers extends Record<string, MutateReducer<T, unknown>>> = {
  [K in keyof Reducers]: GetBoundMutateReducer<Reducers[K]>;
};

export function bindReducers<State, Reducers extends Record<string, Reducer<State, any>>>(reducers: Reducers, store: StoreLike<State>) {
  return mapValues(reducers, (reducer) => bindReducer(reducer, store)) as BoundReducers<State, Reducers>;
}

export function bindMutateReducers<State, Reducers extends Record<string, MutateReducer<State, any>>>(reducers: Reducers, store: StoreLike<State>) {
  return mapValues(reducers, (reducer, key) => bindMutateReducer(reducer, store, key)) as BoundMutateReducers<State, Reducers>;
}

export function bindEffect<Store extends StoreLike, Payload, RT>(
  effect: Effect<Store, Payload, RT>,
  store: Store,
) {
  return (payload: Payload) => effect(store, payload);
}

export function bindEffects<Store extends StoreLike, E extends Record<string, Effect<Store, any, any>>>(
  effects: E,
  store: Store,
) {
  return mapValues(effects, (effect) => bindEffect(effect, store)) as {
    [K in keyof E]: GetBoundEffect<E[K]>;
  };
}
