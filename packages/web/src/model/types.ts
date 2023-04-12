import { Draft } from 'immer';
import {
  User,
  MailReceive, ReadonlyRecord, MailSendDetailed,
} from '../types';

export type ChatChannel = Readonly<{
  userId: string;
  messages: ReadonlyArray<MailReceive | MailSendDetailed>;
}>;

export type AppState = Readonly<{
  userInfo: User | null;
  userInfoDict: ReadonlyRecord<string, User | undefined>;
  users: readonly User[];
  channels: readonly ChatChannel[];
  chatUserId: string | null;
  showChat: boolean;
  showMyProfile: boolean;
  uploadProgressDict: ReadonlyRecord<string, number>;
  longTexts: ReadonlyRecord<string, string>;
}>;

export type CurrentChannelInfo = Readonly<{
  userId: string | null;
  isOnline: boolean;
  userInfo: User | null | undefined;
  channel: ChatChannel | null | undefined;
}>;

export type DraftAppState = Draft<AppState>;

export interface AppStoreState {
  state: AppState;
  /// selectors
  selectCurrentChannel: () => CurrentChannelInfo | null;

  selectFileProgress: (fileId: string) => number;

  /// mutations
  updateUploadProgress: (fileId: string, progress: number) => void;
  updateUserInfo: (user: User) => void;
  updateUsers: (users: User[]) => void;
  pushMail: (mail: MailReceive | MailSendDetailed) => void;
  enterChatWithUser: (userId: string) => void;
  exitChat: () => void;

  /// asyncs
  fetchAndListen: () => Promise<void>;
  sendMessage: (userId: string, message: string | File) => void;
}
