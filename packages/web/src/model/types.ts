import { Draft } from 'immer';
import {
  User,
  MailReceive, ReadonlyRecord, MailSendDetailed,
} from '../types';

export type ChatChannel = Readonly<{
  userId: string;
  unreadCount: number;
  messages: ReadonlyArray<MailReceive | MailSendDetailed>;
}>;

export type UserInfoDict = ReadonlyRecord<string, User | undefined>;

export type ChatChannelDict = ReadonlyRecord<string, ChatChannel | undefined>;

export type AppState = Readonly<{
  online: boolean;
  userInfo: User | null;
  /// a userId -> user map, including offline users
  userInfoDict: ReadonlyRecord<string, User | undefined>;
  /// currently online users
  users: readonly User[];
  channels: readonly ChatChannel[];
  chatUserId: string | null;
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
