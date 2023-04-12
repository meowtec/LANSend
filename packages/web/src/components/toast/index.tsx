import { PropsWithChildren, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { useTimeout } from 'react-use';
import './index.scss';

export interface BaseToastProps {
  visible: boolean;
  onFadeOut: () => void;
}

export function BaseToast({ visible, onFadeOut, children }: PropsWithChildren<BaseToastProps>) {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <CSSTransition
      in={visible}
      nodeRef={nodeRef}
      timeout={400}
      classNames="toast"
      mountOnEnter
      unmountOnExit
      onExited={onFadeOut}
    >
      <div ref={nodeRef} className="toast" role="alert">
        <div className="toast__content">
          {children}
        </div>
      </div>
    </CSSTransition>
  );
}

type ToastProps = Pick<BaseToastProps, 'onFadeOut'> & {
  duration?: number;
};

export function Toast({ onFadeOut, duration, children }: PropsWithChildren<ToastProps>) {
  const [hidden] = useTimeout(duration);

  return (
    <BaseToast
      visible={!hidden()}
      onFadeOut={onFadeOut}
    >
      {children}
    </BaseToast>
  );
}
