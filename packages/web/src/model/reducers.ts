import { castDraft, Draft } from 'immer';
import { userInfoDictFromList } from '#/utils/user';
import { MailReceive, MailSendDetailed, User } from '../types';
import { createDefineMutateReducerFor } from '../utils/zustand';
import { ChatChannel, AppState } from './types';

const defineMutateReducer = createDefineMutateReducerFor<AppState>();

const createChannelMap = <T extends { userId: string }>(channels: T[]): ReadonlyMap<string, T> => {
  const channelMap = new Map<string, T>();
  for (const channel of channels) {
    channelMap.set(channel.userId, channel);
  }
  return channelMap;
};

const eachReceiversChannel = (draft: Draft<AppState>, receivers: readonly string[], fn: (draftChannel: Draft<ChatChannel>) => void) => {
  const { channels } = draft;
  const channelMap = createChannelMap(channels);
  for (const receiver of receivers) {
    const channel = channelMap.get(receiver);
    if (channel) {
      fn(channel);
    } else {
      const newChannel: Draft<ChatChannel> = castDraft({
        userId: receiver,
        unreadCount: 0,
        messages: [],
      });
      channels.push(castDraft(newChannel));
      fn(newChannel);
    }
  }
};

export interface UpdateUploadProgressPayload {
  fileId: string;
  progress: number;
}

// TODO use `satisfies` keyword when eslint can parse it:
// ```
// const updateUploadProgress = ((draft, xxx) => xxx) satisfies MutateReducer<AppState, any>;
// ```
export const updateUploadProgress = defineMutateReducer((draft, { fileId, progress }: UpdateUploadProgressPayload) => {
  draft.uploadProgressDict[fileId] = progress;
});

export const updateUserInfo = defineMutateReducer((draft, user: User) => {
  draft.userInfo = user;
});

export const updateUsers = defineMutateReducer((draft, users: User[]) => {
  draft.users = users;
  Object.assign(draft.userInfoDict, userInfoDictFromList(users));
});

export const pushMail = defineMutateReducer((draft, mail: MailReceive | MailSendDetailed) => {
  const isIncoming = 'sender' in mail;
  const channelUserIds = isIncoming
    ? [mail.sender]
    : mail.receivers;

  eachReceiversChannel(draft, channelUserIds, (draftChannel) => {
    draftChannel.messages.push(castDraft(mail));
    if (isIncoming && draft.chatUserId !== draftChannel.userId) {
      draftChannel.unreadCount += 1;
    }
  });
});

export const replacePreMail = defineMutateReducer((draft, mail: MailSendDetailed) => {
  eachReceiversChannel(draft, mail.receivers, (draftChannel) => {
    const index = draftChannel.messages.findIndex((m) => m.id === mail.id);
    if (index !== -1) {
      draftChannel.messages[index] = castDraft(mail);
    }
  });
});

export const enterChatWithUser = defineMutateReducer((draft, userId: string) => {
  draft.chatUserId = userId;
});

export const enterMyProfile = defineMutateReducer((draft) => {
  draft.showMyProfile = true;
});

export const exitChat = defineMutateReducer((draft) => {
  draft.chatUserId = null;
});

export const exitMyProfile = defineMutateReducer((draft) => {
  draft.showMyProfile = false;
});

export const clearUnreadCount = defineMutateReducer((draft, userId: string) => {
  const channel = draft.channels.find((c) => c.userId === userId);
  if (channel) {
    channel.unreadCount = 0;
  }
});

export const turnOnline = defineMutateReducer((draft) => {
  draft.online = true;
});

export const turnOffline = defineMutateReducer((draft) => {
  draft.online = false;
});
