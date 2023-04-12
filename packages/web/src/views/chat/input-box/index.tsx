import clsx from 'clsx';
import { useState } from 'react';
import Icon from '@meowtec/lansend-shared/components/icon';
import { useTextAreaAutoHeight } from '#/utils/use-auto-height';
import FilePicker from '#/components/file-picker';
import sendIcon from '#/assets/icons/send.svg';
import uploadIcon from '#/assets/icons/outbox.svg';
import './index.scss';

interface InputBoxProps {
  onSubmit: (content: File | string) => void;
}

export default function InputBox({ onSubmit }: InputBoxProps) {
  const { ref: inputRef } = useTextAreaAutoHeight();
  const [textValue, setTextValue] = useState('');

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    setTextValue('');
    onSubmit(textValue);
  };

  const handleTextChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    setTextValue(event.target.value);
  };

  const handleFilesPick = (files: FileList) => {
    onSubmit(files[0]);
  };

  const handleTextKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      handleSubmit(event);
    }
  };

  return (
    <form
      className="writer"
      onSubmit={handleSubmit}
    >
      <textarea
        ref={inputRef}
        value={textValue}
        className="writer__input"
        placeholder="Type here, CMD+Enter to send"
        onChange={handleTextChange}
        onKeyDown={handleTextKeyDown}
      />

      <div className={clsx('writer__menu', !textValue && '_show-file')}>
        <div>
          <button
            className="button writer__button"
            type="submit"
          >
            <Icon name={sendIcon} />
          </button>
          <FilePicker
            onFilePick={handleFilesPick}
          >
            {({ onClick, inputNode }) => (
              <button
                className="button writer__button"
                type="button"
                onClick={onClick}
              >
                {inputNode}
                <Icon name={uploadIcon} />
              </button>
            )}
          </FilePicker>

        </div>
      </div>
    </form>
  );
}
