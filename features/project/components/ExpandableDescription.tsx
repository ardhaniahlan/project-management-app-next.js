'use client';

import { useState } from 'react';

export function ExpandableDescription({ text }: { text: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return <p className="text-sm text-gray-500">Tidak ada deskripsi.</p>;

  if (text.length <= 100) {
    return <p className="text-sm text-gray-500">{text}</p>;
  }

  return (
    <div>
      <p className={`text-sm text-gray-500 ${isExpanded ? '' : 'line-clamp-2'} max-w-3xl transition-all duration-200`}>
        {text}
      </p>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 mt-1"
      >
        {isExpanded ? 'Sembunyikan' : 'Baca selengkapnya...'}
      </button>
    </div>
  );
}