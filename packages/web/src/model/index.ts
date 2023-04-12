import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bindEffects, bindMutateReducers } from '#/utils/zustand';
import { initialState } from './default';
import { AppState } from './types';
import {
  updateUploadProgress,
  updateUserInfo,
  updateUsers,
  pushMail,
  replacePreMail,
  enterChatWithUser,
  exitChat,
  exitMyProfile,
} from './reducers';
import { fetchAndListen, modifyUserInfo, sendMessage } from './effects';
import { createSelectors } from './selectors';

const useAppStoreBase = create<AppState>()(persist(() => initialState, {
  name: 'chat-storage',
  version: 0,
}));

export type UseAppStoreExtended = typeof useAppStoreBase & {
  selectors: typeof selectors;
  reducers: typeof reducers;
  effects: typeof effects;
};

export const selectors = createSelectors();

export const reducers = {
  ...bindMutateReducers({
    updateUploadProgress,
    updateUserInfo,
    updateUsers,
    pushMail,
    replacePreMail,
    enterChatWithUser,
    exitChat,
    exitMyProfile,
  }, useAppStoreBase),
};

export type Selectors = typeof selectors;

export type Reducers = typeof reducers;

export const effects = bindEffects({
  fetchAndListen,
  sendMessage,
  modifyUserInfo,
}, useAppStoreBase as UseAppStoreExtended);

export const useAppStore: UseAppStoreExtended = Object.assign(useAppStoreBase, {
  selectors,
  reducers,
  effects,
});
