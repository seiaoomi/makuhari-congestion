'use client';

import { addDays, format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function DatePicker({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: 10 }, (_, i) => i).map(offset => {
        const d = addDays(new Date(), offset);
        const isSelected =
          format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
        return (
          <button
            key={offset}
            onClick={() => onSelect(d)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div>{offset === 0 ? '今日' : format(d, 'M/d', { locale: ja })}</div>
            <div className="text-xs opacity-70">
              {format(d, 'E', { locale: ja })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
