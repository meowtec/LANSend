import React, { useEffect, useRef, type PropsWithChildren } from 'react';
import clsx from 'clsx';
import type { Placement, Strategy, UseFloatingReturn } from '@floating-ui/react-dom';
import {
  offset, arrow, shift, useFloating,
} from '@floating-ui/react-dom';
import Icon from '@meowtec/lansend-shared/components/icon';
import tooltipArrowIcon from '#/assets/icons/tooltip-arrow.svg';
import './index.scss';

interface UseTooltipParams {
  /** 定位位置，'bottom-start' | 'top-start' */
  placement: Placement;
  /** fixed 还是 absolute，需要根据 tooltip 和目标元素在 DOM 中的相对位置
   * 和目标元素的 position 决定。
   * 默认 absolute
   */
  strategy?: Strategy;
}

interface UseTooltipReturn {
  floating: UseFloatingReturn;
  arrowRef: React.MutableRefObject<HTMLDivElement | null>;
}

export function useTooltip(params?: UseTooltipParams): UseTooltipReturn {
  const arrowRef = useRef<HTMLDivElement | null>(null);

  return {
    arrowRef,
    floating: useFloating(params ? {
      strategy: params.strategy,
      placement: params.placement,
      middleware: [
        offset({
          mainAxis: 10,
          crossAxis: 0,
        }),
        shift(),
        arrow({
          element: arrowRef,
          padding: 8,
        }),
      ],
    } : undefined),
  };
}

interface TooltipProps extends UseTooltipReturn {
  visible: boolean;
  floating: UseFloatingReturn;
  arrowRef: React.MutableRefObject<HTMLDivElement | null>;
}

/**
 * @example
 * const tooltipProps = useTooltip({
 *   placement: 'bottom-start',
 * });

 * <div ref={tooltipProps.floating.reference}>目标元素</div>
 * <Tooltip
 *   {...tooltipProps}
 *   visible={tooltipVisible}
 * />
 *
 */
export default function Tooltip({
  visible,
  floating,
  arrowRef,
  children,
  className,
  style,
  ...props
}: PropsWithChildren<TooltipProps & React.HTMLAttributes<HTMLDivElement>>) {
  const { middlewareData: { arrow: arrowData }, update } = floating;

  useEffect(() => {
    if (visible) {
      update();
    }
  }, [update, visible]);

  return (
    <div
      {...props}
      ref={floating.floating}
      data-placement={floating.placement}
      className={clsx(
        'tooltip',
        visible && 'is-visible',
        className,
      )}
      style={{
        position: floating.strategy,
        top: floating.y ?? 0,
        left: floating.x ?? 0,
        ...style,
      }}
    >
      <div
        ref={arrowRef}
        className="tooltip__arrow"
        style={{
          top: arrowData?.y,
          left: arrowData?.x,
        }}
      >
        <Icon name={tooltipArrowIcon} />
      </div>
      {children}
    </div>
  );
}
