import { FileObject } from '#/types';
import { useAppStore } from '#/model';
import Icon from '@meowtec/lansend-shared/components/icon';
import { formatFileSize } from '#/utils/file-size';
import { getFileIcon } from './file-icon';

interface FileMessageConnectedProps {
  isSend: boolean;
  content: FileObject;
}

interface FileMessageProps extends FileMessageConnectedProps {
  uploadProgress?: number;
}

function FileMessage({
  isSend,
  uploadProgress,
  content,
}: FileMessageProps) {
  return (
    <div className="message-file">
      <Icon
        name={getFileIcon(content.name)}
        className="message-file__icon"
      />
      <div className="message-file__content">
        <div className="ellipsis message-file__name">
          {content.name}
        </div>
        <div className="message-file__size">
          {formatFileSize(content.size)}
        </div>
      </div>
      {isSend ? (
        <div
          className="message-file__progress"
        >
          <div
            style={{ width: `${uploadProgress ?? 0}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function FileMessageConnected({
  isSend,
  content,
}: FileMessageConnectedProps) {
  const { progress } = useAppStore((state) => ({
    progress: isSend ? state.uploadProgressDict[content.id] : 0,
  }));

  return (
    <FileMessage
      isSend={isSend}
      content={content}
      uploadProgress={progress}
    />
  );
}
