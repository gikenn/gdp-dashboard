import React from 'react';
import { Globe2, Layers } from 'lucide-react';
import { ISO3_TO_ISO2 } from '../data/isoCodeMap';

export interface CountryFlagProps {
  code: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<CountryFlagProps['size']>, string> = {
  xs: 'w-4 h-[12px]',
  sm: 'w-5 h-[15px]',
  md: 'w-6 h-[18px]',
  lg: 'w-11 h-[33px]',
};

const ICON_SIZE_CLASSES: Record<NonNullable<CountryFlagProps['size']>, string> = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-5 h-5',
};

// Direct ISO-3 -> flag-icons code overrides for supranational or special entities
const SPECIAL_FLAG_CODES: Record<string, string> = {
  EUU: 'eu',
  EMU: 'eu',
};

export const CountryFlag: React.FC<CountryFlagProps> = ({
  code,
  size = 'sm',
  className = '',
}) => {
  const normalizedCode = code?.trim().toUpperCase() || '';
  const mappedIso2 =
    SPECIAL_FLAG_CODES[normalizedCode] || ISO3_TO_ISO2[normalizedCode]?.toLowerCase();

  const dimensions = SIZE_CLASSES[size];
  const iconDimensions = ICON_SIZE_CLASSES[size];
  const borderRadius = size === 'lg' ? 'rounded-md' : 'rounded-[3px]';

  if (mappedIso2) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 overflow-hidden border border-white/25 shadow-xs bg-slate-900/50 ${borderRadius} ${dimensions} ${className}`}
        aria-hidden="true"
      >
        <span className={`fi fi-${mappedIso2} !w-full !h-full bg-cover bg-center block`} />
      </span>
    );
  }

  const isWorld = normalizedCode === 'WLD';

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden border border-white/25 shadow-xs ${
        isWorld
          ? 'bg-gradient-to-br from-[#1d3557] to-[#457b9d] text-[#f1faee]'
          : 'bg-white/10 text-[#a8dadc]'
      } ${borderRadius} ${dimensions} ${className}`}
      aria-hidden="true"
      title={isWorld ? 'World' : 'Regional or Income Aggregate'}
    >
      {isWorld ? (
        <Globe2 className={iconDimensions} />
      ) : (
        <Layers className={iconDimensions} />
      )}
    </span>
  );
};
