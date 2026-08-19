import React from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
  headerIcon?: React.ReactNode;
}

export const AuthLayout = ({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerHref,
  headerIcon,
}: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-7">

        <div className="flex flex-col items-center mb-6 text-center">
          {headerIcon && (
            <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center text-blue-700 mb-3">
              {headerIcon}
            </div>
          )}
          <h1 className="text-lg font-bold text-gray-900 mb-1 tracking-tight">{title}</h1>
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed">{subtitle}</p>
        </div>

        {children}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {footerText}{' '}
            <a href={footerHref} className="font-semibold text-blue-600 hover:text-blue-700">
              {footerLinkText}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};