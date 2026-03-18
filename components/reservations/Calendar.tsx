'use client';

import React, { useState, useEffect } from 'react';

interface Reservation {
  startDate: string | Date;
  endDate: string | Date;
  status: string;
}

interface CalendarProps {
  reservations: Reservation[];
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  onDateSelect: (start: Date | null, end: Date | null) => void;
}

export default function Calendar({
  reservations,
  selectedStartDate,
  selectedEndDate,
  onDateSelect,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateReserved = (date: Date) => {
    return reservations.some((res) => {
      const start = new Date(res.startDate);
      const end = new Date(res.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      date.setHours(12, 0, 0, 0);
      return date >= start && date <= end;
    });
  };

  const isDateSelected = (date: Date) => {
    if (!selectedStartDate) return false;

    const start = new Date(selectedStartDate);
    start.setHours(0, 0, 0, 0);

    if (!selectedEndDate) {
      return date.toDateString() === start.toDateString();
    }

    const end = new Date(selectedEndDate);
    end.setHours(23, 59, 59, 999);
    date.setHours(12, 0, 0, 0);

    return date >= start && date <= end;
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today || isDateReserved(date)) {
      return;
    }

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      onDateSelect(date, null);
    } else {
      // Complete selection
      if (date < selectedStartDate) {
        onDateSelect(date, selectedStartDate);
      } else {
        // Check if there are reserved dates in between
        let hasReservedInBetween = false;
        const checkDate = new Date(selectedStartDate);
        while (checkDate < date) {
          checkDate.setDate(checkDate.getDate() + 1);
          if (isDateReserved(checkDate) && checkDate < date) {
            hasReservedInBetween = true;
            break;
          }
        }

        if (hasReservedInBetween) {
          alert('Cannot select dates with reserved days in between');
          onDateSelect(null, null);
        } else {
          onDateSelect(selectedStartDate, date);
        }
      }
    }
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);

  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-12" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isPast = date < today;
    const reserved = isDateReserved(date);
    const selected = isDateSelected(date);

    let bgColor = 'bg-green-100 hover:bg-green-200'; // Available
    let textColor = 'text-gray-900';
    let cursor = 'cursor-pointer';

    if (isPast) {
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-400';
      cursor = 'cursor-not-allowed';
    } else if (reserved) {
      bgColor = 'bg-red-100';
      textColor = 'text-red-900';
      cursor = 'cursor-not-allowed';
    } else if (selected) {
      bgColor = 'bg-blue-500';
      textColor = 'text-white';
    }

    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(date)}
        disabled={isPast || reserved}
        className={`h-12 rounded-lg font-medium transition ${bgColor} ${textColor} ${cursor}`}
      >
        {day}
      </button>,
    );
  }

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 bg-gray-400 hover:bg-gray-500 rounded-full transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="white"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-600">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 bg-gray-400 hover:bg-gray-500 rounded-full transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="white"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-700"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">{days}</div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-300 rounded" />
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-300 rounded" />
          <span className="text-gray-600">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <span className="text-gray-600">Past</span>
        </div>
      </div>
    </div>
  );
}
