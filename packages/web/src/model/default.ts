import { AppState } from './types';

export const initialState: AppState = {
  userInfo: null,
  userInfoDict: {},
  users: [],
  channels: [],
  uploadProgressDict: {},
  longTexts: {},
  chatUserId: null,
  showChat: false,
  showMyProfile: false,
};