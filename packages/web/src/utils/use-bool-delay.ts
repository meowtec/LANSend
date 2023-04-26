import { useMemo, useRef, useState } from 'react';

/**
 * A powerful hook to handle boolean state with delay.
 * @param value the initial value
 * @param options
 * @returns
 */
export function useBoolDelay(value: boolean, options: {
  /**
   * The delay to change the state to true. in milliseconds.
   */
  toTrueDelay: number;
  /**
   * The delay to change the state to false. in milliseconds.
   */
  toFalseDelay: number;
}) {
  const [state, setState] = useState(value);
  const toTrueTimeoutRef = useRef<number | null>(null);
  const toFalseTimeoutRef = useRef<number | null>(null);

  const fns = useMemo(() => {
    const clearTimeoutRef = (ref: React.MutableRefObject<number | null>) => {
      if (ref.current != null) {
        window.clearTimeout(ref.current);
        ref.current = null;
      }
    };

    const createDelayTo = (target: boolean) => () => {
      const selfTimeoutRef = target ? toTrueTimeoutRef : toFalseTimeoutRef;
      const oppositeTimeoutRef = target ? toFalseTimeoutRef : toTrueTimeoutRef;

      if (selfTimeoutRef.current) return;

      clearTimeoutRef(oppositeTimeoutRef);

      selfTimeoutRef.current = window.setTimeout(() => {
        setState(target);
        selfTimeoutRef.current = null;
      }, target ? options.toTrueDelay : options.toFalseDelay);
    };

    const createImmediateTo = (target: boolean) => () => {
      clearTimeoutRef(toTrueTimeoutRef);
      clearTimeoutRef(toFalseTimeoutRef);

      setState(target);
    };

    const delayToTrue = createDelayTo(true);
    const delayToFalse = createDelayTo(false);
    const setTrue = createImmediateTo(true);
    const setFalse = createImmediateTo(false);

    return {
      delayToTrue, delayToFalse, setTrue, setFalse,
    };
  }, [options.toFalseDelay, options.toTrueDelay]);

  return [state, fns] as const;
}
