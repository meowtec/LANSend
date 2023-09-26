import { AppState } from './types';

export const initialState: AppState = {
  online: false,
  userInfo: null,
  userInfoDict: {},
  users: [],
  channels: [],
  uploadProgressDict: {},
  longTexts: {},
  chatUserId: null,
  showMyProfile: false,
};
