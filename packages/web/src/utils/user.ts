import { User } from '#/types';
import { ChatChannel, ChatChannelDict, UserInfoDict } from '#/model/types';
import { arrayToMap } from './object';

export function userInfoDictFromList(users: readonly User[]): UserInfoDict {
  return arrayToMap(users, (user) => user.id);
}

export function channelDictFromList(channels: readonly ChatChannel[]): ChatChannelDict {
  return arrayToMap(channels, (channel) => channel.userId);
}
