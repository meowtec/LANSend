import { castDraft, Draft } from 'immer';
import { MailReceive, MailSendDetailed, User } from '../types';
import { fromPairs } from '../utils/object';
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
  Object.assign(draft.userInfoDict, fromPairs(users.map((user) => [user.id, user])));
});

export const pushMail = defineMutateReducer((draft, mail: MailReceive | MailSendDetailed) => {
  const channelUserIds = 'sender' in mail
    ? [mail.sender]
    : mail.receivers;

  eachReceiversChannel(draft, channelUserIds, (channel) => {
    channel.messages.push(castDraft(mail));
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
  draft.showChat = true;
  draft.chatUserId = userId;
});

export const enterMyProfile = defineMutateReducer((draft) => {
  draft.showMyProfile = true;
});

export const exitChat = defineMutateReducer((draft) => {
  draft.showChat = false;
});

export const exitMyProfile = defineMutateReducer((draft) => {
  draft.showMyProfile = false;
});
