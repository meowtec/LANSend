import './index.scss';

interface IconProps {
  name: string;
  className?: string;
}

export default function Icon({ name, className }: IconProps) {
  return (
    <svg
      className={`icon ${className ?? ''}`}
      aria-hidden="true"
    >
      <use
        xlinkHref={`#${name}`}
      />
    </svg>
  );
}
