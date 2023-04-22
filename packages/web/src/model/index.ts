import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bindEffects, bindMutateReducers } from '#/utils/zustand';
import { WS } from '#/types';
import { initialState } from './default';
import { AppState } from './types';
import {
  updateUploadProgress,
  updateUserInfo,
  updateUsers,
  pushMail,
  replacePreMail,
  enterChatWithUser,
  enterMyProfile,
  exitChat,
  exitMyProfile,
  clearUnreadCount,
} from './reducers';
import {
  connect, disconnect, modifyUserInfo, sendMessage,
} from './effects';
import { createSelectors } from './selectors';

const useAppStoreBase = create<AppState>()(persist(() => initialState, {
  name: 'chat-storage',
  version: 0,
}));

export type UseAppStoreExtended = typeof useAppStoreBase & {
  ws: WS | null;
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
    enterMyProfile,
    exitChat,
    exitMyProfile,
    clearUnreadCount,
  }, useAppStoreBase),
};

export type Selectors = typeof selectors;

export type Reducers = typeof reducers;

export const effects = bindEffects({
  connect,
  disconnect,
  sendMessage,
  modifyUserInfo,
}, useAppStoreBase as UseAppStoreExtended);

export const useAppStore: UseAppStoreExtended = Object.assign(useAppStoreBase, {
  ws: null,
  selectors,
  reducers,
  effects,
});
