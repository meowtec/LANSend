import { useEffect, useRef } from 'react';
import { watchProp } from './proxy-get-set';

const DEFAULT_MAX_ROWS = 5;

interface SetAutoHeightOptions {
  maxRows?: number;
}

function watchValuePropChange(element: HTMLTextAreaElement | HTMLInputElement) {
  if (element.dataset.shouldDispatchValueSet) {
    return;
  }

  element.dataset.shouldDispatchValueSet = 'true';

  watchProp(element, 'value', () => {
    element.dispatchEvent(new CustomEvent('value-set'));
  });
}

export function setAutoHeight(
  textarea: HTMLTextAreaElement,
  { maxRows }: SetAutoHeightOptions = {},
) {
  textarea.style.height = '0px';
  const computedStyles = window.getComputedStyle(textarea);
  const lineHeight = parseFloat(computedStyles.lineHeight);
  const paddingTop = parseFloat(computedStyles.paddingTop);
  const paddingBottom = parseFloat(computedStyles.paddingBottom);

  textarea.style.height = `${Math.min(
    textarea.scrollHeight + 1,
    (maxRows ?? DEFAULT_MAX_ROWS) * lineHeight + paddingTop + paddingBottom,
  )}px`;
}

export function watchSetAutoHeight(textarea: HTMLTextAreaElement) {
  const handleChange = () => {
    setAutoHeight(textarea);
  };

  watchValuePropChange(textarea);

  textarea.addEventListener('value-set', handleChange);
  textarea.addEventListener('input', handleChange);

  handleChange();

  return () => {
    textarea.removeEventListener('input', handleChange);
  };
}

export function useTextAreaAutoHeight(options: { maxRows?: number } = {}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && !el.dataset.autoHeight) {
      el.dataset.autoHeight = 'true';
      return watchSetAutoHeight(el);
    }

    return undefined;
  }, [ref]);

  return { ref };
}
