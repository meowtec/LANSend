// SWR
// import { create } from 'zustand';
// import { ReadonlyRecord } from '#/types';
// import { bindEffects, bindMutateReducers } from '#/utils/zustand';

// enum LongTextStatus {
//   Loading = 0,
// }

// type LongTextValue = string | LongTextStatus;

// export type LongTextRecord = ReadonlyRecord<string, LongTextValue>;

// const useLongTextRecord = create<LongTextRecord>()(() => ({}));

// export const mutates = bindMutateReducers({
//   setLongText: (draft, payload: { fileId: string; text: LongTextValue }) => {
//     draft[payload.fileId] = payload.text;
//   },
// }, useLongTextRecord);

// export const effects = bindEffects({
//   fetchLongText: async (store, payload: { fileId: string }) => {
//     if (store.getState()[payload.fileId] !== undefined) {
//       return;
//     }
//     mutates.setLongText(LongTextStatus.Loading);
//   },
// }, useLongTextRecord);
