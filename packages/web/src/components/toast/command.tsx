import { ReactNode } from 'react';
import { renderToBody } from '#/utils/render-to-body';
import { Toast } from '.';

interface ShowToastParams {
  content: ReactNode;
  duration?: number;
}

export function showToast({ content, duration }: ShowToastParams) {
  renderToBody((destroy) => (
    <Toast
      duration={duration ?? 3000}
      onFadeOut={() => setTimeout(destroy, 0)}
    >
      {content}
    </Toast>
  ));
}
