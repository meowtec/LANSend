import React, {
  ReactNode, useCallback, useRef, useState,
} from 'react';

interface FilePickerProps {
  multiple?: boolean;
  accept?: string;
  onFilePick(files: FileList): void;
  children(renderProps: {
    onClick: (e: React.MouseEvent | undefined) => void;
    inputNode: ReactNode;
  }): React.ReactElement;
}

export default function FilePicker({
  multiple,
  accept,
  onFilePick,
  children,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputIncKey, setInputIncKey] = useState(0);

  const handleClick = useCallback((e: React.MouseEvent | undefined) => {
    e?.preventDefault();
    inputRef.current?.dispatchEvent(new MouseEvent('click'));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilePick(e.target.files);
      setInputIncKey((key) => key + 1);
    }
  };

  return children({
    onClick: handleClick,
    inputNode: (
      <input
        key={inputIncKey}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="visual-hide"
        onChange={handleInputChange}
      />
    ),
  });
}
