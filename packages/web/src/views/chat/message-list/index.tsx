import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { useMount } from 'react-use';
import { MailReceive, MailSendDetailed } from '#/types';
import Message from '../message';
import './index.scss';

interface MessageListProps {
  messages: ReadonlyArray<MailReceive | MailSendDetailed>;
  className?: string;
}

export default function MessageList({ messages, className }: MessageListProps) {
  const isAtBottomRef = useRef(true);
  const ref = useRef<HTMLDivElement>(null);

  useMount(() => {
    ref.current?.scrollTo(0, ref.current.scrollHeight);
  });

  const handleScroll = () => {
    isAtBottomRef.current = ref.current
      ? ref.current.scrollTop + ref.current.clientHeight >= ref.current.scrollHeight
      : true;
  };

  /// if at bottom, scroll to bottom when new message arrives
  useEffect(() => {
    if (isAtBottomRef.current) {
      ref.current?.scrollTo(0, ref.current.scrollHeight);
    }
  }, [messages.length]);

  return (
    <div
      ref={ref}
      className={clsx('message-list', className)}
      onScroll={handleScroll}
    >
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
        />
      ))}
    </div>
  );
}
