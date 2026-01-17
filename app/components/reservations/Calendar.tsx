'use client';

import React from 'react';
import { Reservation } from '../../types/types';

interface CalendarProps {
  reservations: Reservation[];
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onSelect: (start: Date | null, end: Date | null) => void;
}

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

export default function Calendar({
  reservations,
  selectedStart,
  selectedEnd,
  onSelect,
}: CalendarProps) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  // Check if date is reserved
  const isReserved = (date: Date) =>
    reservations.some((r) => {
      // Use both possible keys in case backend sends different format
      const startStr = (r as any).start_date || (r as any).startDate;
      const endStr = (r as any).end_date || (r as any).endDate;
      if (!startStr || !endStr) return false;

      const start = new Date(startStr);
      const end = new Date(endStr);

      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      // Reserved if date >= start and < end
      return d >= start && d <= end;
    });

  // Check if date is in selected range
  const isInRange = (date: Date) =>
    selectedStart &&
    selectedEnd &&
    date >= selectedStart &&
    date <= selectedEnd;

  // Handle day click
  const handleClick = (date: Date) => {
    if (isReserved(date)) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      onSelect(date, null);
    } else if (date < selectedStart) {
      onSelect(date, selectedStart);
    } else {
      onSelect(selectedStart, date);
    }
  };

  // Build calendar cells
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }

  return (
    <div className="space-y-3">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-600">
        {WEEK_DAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} />; // empty cell for offset

          const reserved = isReserved(date);
          const selected = isInRange(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleClick(date)}
              disabled={reserved}
              className={`h-10 rounded text-sm font-semibold
                ${
                  reserved
                    ? 'bg-red-300 text-red-900 cursor-not-allowed'
                    : selected
                      ? 'bg-blue-300 text-blue-900'
                      : 'bg-green-200 text-green-800 hover:bg-green-300'
                }
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
