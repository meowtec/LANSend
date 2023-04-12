import { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

export function renderToBody(render: (destroy: () => void) => ReactNode) {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);

  const destroy = () => {
    root.unmount();
    document.body.removeChild(div);
  };

  root.render(render(destroy));

  return destroy;
}
