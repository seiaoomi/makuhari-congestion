'use client';

import { useState } from 'react';

export default function MapView() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div>
          <span className="font-semibold text-gray-200 text-sm">対象エリアマップ</span>
          <span className="ml-2 text-xs text-gray-500">幕張IC・湾岸道路・国道357号</span>
        </div>
        <span className="text-gray-400 text-xs">{open ? '▲ 閉じる' : '▼ 地図を表示'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-800">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=139.995%2C35.627%2C140.062%2C35.665&layer=mapnik"
            className="w-full h-64 md:h-80"
            loading="lazy"
            title="幕張エリアマップ"
          />
          <div className="px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
            <span className="text-xs text-gray-500">📍 幕張メッセ</span>
            <span className="text-xs text-gray-500">🛒 イオンモール幕張新都心</span>
            <span className="text-xs text-gray-500">🏪 コストコ幕張</span>
            <span className="text-xs text-gray-500">🚃 海浜幕張駅</span>
          </div>
        </div>
      )}
    </div>
  );
}
