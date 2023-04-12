import clsx from 'clsx';
import { MailReceive, MailSendDetailed } from '#/types';
import Message from '../message';
import './index.scss';

interface MessageListProps {
  messages: ReadonlyArray<MailReceive | MailSendDetailed>;
  className?: string;
}

export default function MessageList({ messages, className }: MessageListProps) {
  return (
    <div className={clsx('message-list', className)}>
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
        />
      ))}
    </div>
  );
}
