import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-primary"
      >
        <line x1="12" x2="12" y1="2" y2="22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
      <h1 className="text-3xl font-bold text-foreground font-headline">
        Visão Financeira
      </h1>
    </div>
  );
};

export default Logo;
