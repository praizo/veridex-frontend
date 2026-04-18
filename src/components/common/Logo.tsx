import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  showTrademark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", iconOnly = false, showTrademark = true }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <path d="M3 5.5L13 2L23 5.5V13C23 18.5 18.5 22.5 13 24C7.5 22.5 3 18.5 3 13V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"></path>
        <path d="M8 12.5L11.5 16L18 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
      {!iconOnly && (
        <span className="text-[17px] font-semibold tracking-tight">
          Veridex{showTrademark && <sup className="text-[9px] font-medium opacity-60 ml-0.5">™</sup>}
        </span>
      )}
    </div>
  );
};
