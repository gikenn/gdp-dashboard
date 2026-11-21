import React from 'react';

interface GlassBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  rounded?: boolean;
  className?: string;
  contentClassName?: string;
}

export const GlassBox: React.FC<GlassBoxProps> = ({
  children,
  rounded = false,
  className = '',
  contentClassName = '',
  ...rest
}) => {
  return (
    <div
      className={`glass-container ${rounded ? 'glass-container--rounded' : ''} ${className}`}
      {...rest}
    >
      <div className="glass-filter" aria-hidden="true" />
      <div className="glass-overlay" aria-hidden="true" />
      <div className="glass-specular" aria-hidden="true" />
      <div className={`glass-content ${contentClassName}`}>{children}</div>
    </div>
  );
};

export const LensSvgFilter: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'none' }}
    aria-hidden="true"
  >
    <filter
      id="lensFilter"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feComponentTransfer in="SourceAlpha" result="alpha">
        <feFuncA type="identity" />
      </feComponentTransfer>
      <feGaussianBlur in="alpha" stdDeviation="50" result="blur" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="blur"
        scale="50"
        xChannelSelector="A"
        yChannelSelector="A"
      />
    </filter>
  </svg>
);
