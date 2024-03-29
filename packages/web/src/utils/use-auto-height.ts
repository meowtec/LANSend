import { useEffect, useRef } from 'react';
import { useLatest } from 'react-use';
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

export function watchSetAutoHeight(textarea: HTMLTextAreaElement, options: SetAutoHeightOptions = {}) {
  const handleChange = () => {
    setAutoHeight(textarea, options);
  };

  watchValuePropChange(textarea);

  textarea.addEventListener('value-set', handleChange);
  textarea.addEventListener('input', handleChange);

  handleChange();

  return () => {
    textarea.removeEventListener('input', handleChange);
  };
}

export function useTextAreaAutoHeight(options: SetAutoHeightOptions = {}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const optionsRef = useLatest(options);

  useEffect(() => {
    const el = ref.current;
    if (el && !el.dataset.autoHeight) {
      el.dataset.autoHeight = 'true';
      return watchSetAutoHeight(el, optionsRef.current);
    }

    return undefined;
  }, [optionsRef]);

  return { ref };
}
