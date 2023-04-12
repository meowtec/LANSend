import { useState } from 'react';
import './index.scss';

interface EditableProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Editable({ value, onChange }: EditableProps) {
  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);

  const handleButtonClick = () => {
    if (editing && draftValue !== value) {
      onChange(draftValue);
    }

    setEditing(!editing);
  };

  return (
    <div className="editable">
      {
        editing ? (
          <input
            value={draftValue}
            className="editable__input"
            maxLength={16}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            disabled={!editing}
            onChange={(e) => setDraftValue(e.target.value)}
          />
        ) : (
          <span
            className="editable__text"
          >
            {value}
          </span>
        )
      }

      <button
        type="button"
        className="button link editable__button"
        onClick={handleButtonClick}
      >
        {editing ? 'Save' : 'Edit'}
      </button>

    </div>
  );
}
