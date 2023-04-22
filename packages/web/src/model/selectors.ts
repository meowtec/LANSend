import { createSelector } from 'reselect';
import { channelDictFromList } from '#/utils/user';
import { fromPairs } from '#/utils/object';
import { AppState, CurrentChannelInfo } from './types';

export function createSelectors() {
  const selectChannels = (state: AppState) => state.channels;
  const selectUserInfoDict = (state: AppState) => state.userInfoDict;
  const selectUsers = (state: AppState) => state.users;
  const selectChatUserId = (state: AppState) => state.chatUserId;

  const selectChatChannel = createSelector(
    selectChatUserId,
    selectChannels,
    (chatUserId, channels) => channels.find((item) => item.userId === chatUserId),
  );

  const selectChatUserInfo = createSelector(
    selectChatUserId,
    selectUserInfoDict,
    (chatUserId, userInfoDict) => (
      chatUserId
        ? userInfoDict[chatUserId]
        : null
    ),
  );

  const selectChatUserIsOnline = createSelector(
    selectChatUserId,
    selectUsers,
    (chatUserId, users) => (
      chatUserId
        ? users.some((user) => user.id === chatUserId)
        : false
    ),
  );

  const selectChannelDict = createSelector(
    selectChannels,
    channelDictFromList,
  );

  const selectUnreadCounts = createSelector(
    selectChannels,
    (channels) => fromPairs(channels.map((channel) => [channel.userId, channel.unreadCount])),
  );

  const selectCurrentChannel = createSelector(
    selectChatUserId,
    selectChatChannel,
    selectChatUserInfo,
    selectChatUserIsOnline,
    (userId, channel, userInfo, isOnline): CurrentChannelInfo => ({
      userId,
      isOnline,
      userInfo,
      channel,
    }),
  );

  return {
    selectChannelDict,
    selectCurrentChannel,
    selectUnreadCounts,
  };
}
