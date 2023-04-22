import { nanoid } from 'nanoid';
import { MAX_LONG_TEXT_LENGTH, MAX_TEXT_LENGTH } from '#/constants';
import { addPreLongText, uploadFile } from '#/services/file';
import { fetchUserInfo, fetchUsers, updateUserInfo } from '#/services/user';
import { createWs, parseWebSocketMessageBody } from '#/utils/ws';
import { createDefineEffectFor } from '#/utils/zustand';
import {
  MailSendDetailed, MailType, User, WebSocketServerMessage,
} from '../types';
import type { UseAppStoreExtended } from '.';

const defineEffect = createDefineEffectFor<UseAppStoreExtended>();

export const connect = defineEffect((store) => {
  const ws = createWs();

  store.ws = ws;

  ws.instance.addEventListener('message', (event) => {
    console.log('message:', event);
    const message = parseWebSocketMessageBody<WebSocketServerMessage>(event.data as string);
    console.log('emit', message);
    if (!message) return;
    switch (message.type) {
      case 'users': {
        store.reducers.updateUsers(message.content);
        break;
      }

      case 'mail': {
        store.reducers.pushMail(message.content);
        break;
      }

      default:
    }
  });

  ws.instance.addEventListener('open', () => {
    void Promise.all([
      fetchUsers(),
      fetchUserInfo(),
    ]).then(([users, userInfo]) => {
      store.reducers.updateUsers(users);
      store.reducers.updateUserInfo(userInfo);
    });
  });
});

export const disconnect = defineEffect((store) => {
  store.ws?.instance.close();
  store.ws = null;
});

export interface SendMessagePayload {
  userId: string;
  message: string | File;
}

export const sendMessage = defineEffect((store, { userId, message }: SendMessagePayload) => {
  const receivers = [userId];
  const preId = `pre_${nanoid()}`;

  if (typeof message === 'string' && message.length <= MAX_TEXT_LENGTH) {
    const mail: MailSendDetailed = {
      id: preId,
      receivers,
      data: {
        type: MailType.text,
        content: message,
      },
    };

    store.reducers.pushMail(mail);
    store.ws?.sendMessage('mail', {
      ...mail,
      data: {
        type: MailType.text,
        content: message,
      },
    });
  } else {
    const preFileId = `pre_${nanoid()}`;

    const file = typeof message === 'string'
      ? new File([message], `${new Date().toISOString()}-${nanoid()}.txt`, { type: 'text/plain' })
      : message;

    const mailType = typeof message === 'string' && message.length < MAX_LONG_TEXT_LENGTH
      ? MailType.long_text
      : MailType.file;

    const mail: MailSendDetailed = {
      id: preId,
      receivers,
      data: {
        type: typeof message === 'string' && message.length < MAX_LONG_TEXT_LENGTH
          ? MailType.long_text
          : MailType.file,
        content: {
          isPreSend: true,
          id: preFileId,
          name: file.name,
          size: file.size,
        },
      },
    };

    store.reducers.pushMail(mail);

    if (typeof message === 'string') {
      addPreLongText(preFileId, message);
    }

    uploadFile(file, {
      onProgress: (progress) => {
        store.reducers.updateUploadProgress({ fileId: preFileId, progress });
      },
      onSuccess(fileObj) {
        store.reducers.replacePreMail({
          ...mail,
          data: {
            type: mailType,
            content: fileObj,
          },
        });

        store.ws?.sendMessage('mail', {
          ...mail,
          data: {
            type: mailType,
            content: fileObj.id,
          },
        });
      },

      onFail(error) {
        store.reducers.updateUploadProgress({ fileId: preFileId, progress: -1 });
      },
    });
  }
});

export const modifyUserInfo = defineEffect((store, userInfo: User) => {
  const currentUserInfo = store.getState().userInfo;
  updateUserInfo(userInfo)
    .catch((err) => {
      console.error('updateUserInfo error:', err);
      if (currentUserInfo) {
        store.reducers.updateUserInfo(currentUserInfo);
      }
    });

  store.reducers.updateUserInfo(userInfo);
});
