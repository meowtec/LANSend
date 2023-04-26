import clsx from 'clsx';
import { useRef } from 'react';
import {
  useClickAway, useLongPress,
} from 'react-use';
import useMergedRef from '@react-hook/merged-ref';
import copy from 'copy-to-clipboard';
import { MailReceive, MailSendDetailed, MailType } from '#/types';
import Tooltip, { useTooltip } from '#/components/tooltip';
import { useLongText } from '#/services/file';
import { download } from '#/utils/download';
import { useBoolDelay } from '#/utils/use-bool-delay';
import { showToast } from '#/components/toast/command';
import FileMessage from './file-message';
import TextMessage from './text-message';
import './index.scss';

interface MessageProps {
  message: MailReceive | MailSendDetailed;
}

const longPressOptions = {
  isPreventDefault: true,
  delay: 500,
};

export default function Message({ message }: MessageProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tooltipVisible, tooltipVisibleMutates] = useBoolDelay(false, {
    toTrueDelay: 0,
    toFalseDelay: 500,
  });
  const isReceive = 'sender' in message;
  const { data } = message;

  const { data: longText } = useLongText(
    data.type === MailType.long_text
      ? data.content.id
      : null,
  );

  const text = (
    data.type === MailType.long_text
      ? longText
      : data.type === MailType.text
        ? data.content
        : null
  ) ?? '';

  const tooltipProps = useTooltip({
    placement: 'top',
  });

  const onLongPress = () => {
    tooltipVisibleMutates.setTrue();
  };

  const handleMouseEnter = () => {
    tooltipVisibleMutates.setTrue();
  };

  const handleMouseLeave = () => {
    tooltipVisibleMutates.delayToFalse();
  };

  const longPressEvent = useLongPress(onLongPress, longPressOptions);

  useClickAway(ref, () => {
    tooltipVisibleMutates.delayToFalse();
  });

  const handleCopy = () => {
    copy(text);
    tooltipVisibleMutates.setFalse();
    showToast({
      content: 'Copied',
    });
  };

  const handleSave = () => {
    if (data.type !== MailType.file) return;
    download(`/api/file/${data.content.id}`, data.content.name);
    tooltipVisibleMutates.setFalse();
  };

  const mergedRef = useMergedRef(ref, tooltipProps.floating.reference);

  return (
    <>
      <div
        {...longPressEvent}
        ref={mergedRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={clsx('message', isReceive ? 'is-receive' : 'is-send')}
      >
        {
          data.type === MailType.text
            ? <TextMessage content={text} />
            : (
              <FileMessage
                isSend={!isReceive}
                content={data.content}
              />
            )
        }
      </div>
      {tooltipVisible && (
        <Tooltip
          {...tooltipProps}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          visible
        >
          {
            message.data.type === MailType.file ? (
              <button
                className="button tooltip-button"
                type="button"
                onClickCapture={handleSave}
              >
                Save
              </button>
            ) : (
              <button
                className="button tooltip-button"
                type="button"
                onClickCapture={handleCopy}
              >
                Copy
              </button>
            )
          }
        </Tooltip>
      )}
    </>
  );
}
