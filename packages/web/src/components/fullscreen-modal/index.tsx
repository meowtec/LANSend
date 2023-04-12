import { PropsWithChildren, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import Icon from '@meowtec/lansend-shared/components/icon';
import closeIcon from '#/assets/icons/close.svg';
import './index.scss';

interface FullscreenModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FullscreenModal({ visible, onClose, children }: PropsWithChildren<FullscreenModalProps>) {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <CSSTransition
      in={visible}
      nodeRef={nodeRef}
      timeout={300}
      classNames="full-modal"
      unmountOnExit
    >
      <div
        ref={nodeRef}
        className="full-modal"
      >
        <button
          type="button"
          className="button full-modal__close"
          onClick={onClose}
        >
          <Icon name={closeIcon} />
        </button>
        {children}
      </div>
    </CSSTransition>
  );
}
