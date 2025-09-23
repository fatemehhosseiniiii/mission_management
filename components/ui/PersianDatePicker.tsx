import React, { useState, useRef, useEffect, FC } from 'react';
import ReactDOM from 'react-dom';
import jalaali from 'jalaali-js';

const toPersianDigits = (str: string | number): string => {
    if (!str) return '';
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// --- Calendar Portal Component ---
interface CalendarPortalProps {
  onClose: () => void;
  onDateSelect: (date: string) => void;
  onTodaySelect: () => void;
  initialValue: string;
  targetRect: DOMRect;
}

const CalendarPortal: FC<CalendarPortalProps> = ({ onClose, onDateSelect, onTodaySelect, initialValue, targetRect }) => {
  const [displayYear, setDisplayYear] = useState(0);
  const [displayMonth, setDisplayMonth] = useState(0);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, opacity: 0 });
  
  const monthNames = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
  ];

  // Initialize display date
  useEffect(() => {
    if (initialValue && initialValue.includes('/')) {
      const [y, m] = initialValue.split('/');
      setDisplayYear(parseInt(y, 10));
      setDisplayMonth(parseInt(m, 10));
    } else {
      const today = jalaali.toJalaali(new Date());
      setDisplayYear(today.jy);
      setDisplayMonth(today.jm);
    }
  }, [initialValue]);

  // Calculate position
  useEffect(() => {
    if (calendarRef.current && targetRect) {
      const calendarHeight = calendarRef.current.offsetHeight;
      const calendarWidth = calendarRef.current.offsetWidth;
      let top, left;

      // Vertical position
      const spaceBelow = window.innerHeight - targetRect.bottom;
      if (spaceBelow < calendarHeight && targetRect.top > calendarHeight) {
        top = targetRect.top - calendarHeight - 8; // open upwards
      } else {
        top = targetRect.bottom + 8; // open downwards
      }

      // Horizontal position (RTL aware)
      left = targetRect.right - calendarWidth;
      
      // Ensure it doesn't go off-screen
      if (left < 0) {
        left = 8;
      }

      setPosition({ top, left, opacity: 1 });
    }
  }, [targetRect]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Also check that the click is not on the original input
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    // Use timeout to prevent immediate closing due to the click that opened it
    setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const { jy: currentJalaliYear, jm: currentJalaliMonth, jd: currentJalaliDay } = jalaali.toJalaali(new Date());
  
  const daysInMonth = (displayYear > 0) ? jalaali.jalaaliMonthLength(displayYear, displayMonth) : 31;
  const firstDayGregorian = (displayYear > 0) ? jalaali.toGregorian(displayYear, displayMonth, 1) : { gy: 2024, gm: 1, gd: 1 };
  const firstDay = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
  const dayOfWeek = firstDay.getDay(); // JS: 0=Sun, 6=Sat
  const startDayOffset = (dayOfWeek + 1) % 7; // Shamsi: 0=Sat, 6=Fri

  const selectedDateParts = initialValue ? initialValue.split('/') : [];
  const isSelectedMonth = 
    selectedDateParts.length === 3 && 
    parseInt(selectedDateParts[0], 10) === displayYear && 
    parseInt(selectedDateParts[1], 10) === displayMonth;
  const currentDay = isSelectedMonth ? parseInt(selectedDateParts[2], 10) : 0;

  const handlePrevMonth = () => {
    setDisplayMonth(prevMonth => {
        if (prevMonth > 1) return prevMonth - 1;
        setDisplayYear(prevYear => prevYear - 1);
        return 12;
    });
  };

  const handleNextMonth = () => {
    setDisplayMonth(prevMonth => {
        if (prevMonth < 12) return prevMonth + 1;
        setDisplayYear(prevYear => prevYear + 1);
        return 1;
    });
  };

  const calendarJsx = (
    <div 
        ref={calendarRef} 
        style={{ position: 'fixed', top: `${position.top}px`, left: `${position.left}px`, opacity: position.opacity }}
        className="z-[100] w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 transition-opacity duration-150"
    >
        {/* Calendar header */}
        <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            <div className="flex space-x-2 space-x-reverse">
              <select value={displayYear} onChange={(e) => setDisplayYear(parseInt(e.target.value, 10))} className="border rounded px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                {Array.from({ length: 50 }, (_, i) => currentJalaliYear - 25 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select value={displayMonth} onChange={(e) => setDisplayMonth(parseInt(e.target.value, 10))} className="border rounded px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                {monthNames.map((name, index) => (
                  <option key={index + 1} value={index + 1}>{name}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, index) => (
              <div key={index} className="w-10 h-10 flex items-center justify-center font-medium">{day}</div>
            ))}
        </div>
        <div className="grid grid-cols-7 text-center text-sm">
            {Array.from({ length: startDayOffset }).map((_, i) => (<div key={`empty-${i}`} className="w-10 h-10" />))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
              <div key={day} className="py-1 flex items-center justify-center">
                <button
                  type="button"
                  className={`w-9 h-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    currentDay === day 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-700 hover:bg-indigo-100'
                  } ${
                    currentJalaliDay === day && currentJalaliMonth === displayMonth && currentJalaliYear === displayYear && currentDay !== day 
                      ? 'border-2 border-indigo-500' 
                      : ''
                  }`}
                  onClick={() => onDateSelect(`${displayYear}/${String(displayMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`)}
                >
                  {day}
                </button>
              </div>
            ))}
        </div>
        {/* Calendar footer */}
        <div className="flex justify-between items-center mt-4 text-sm border-t pt-2">
            <button type="button" onClick={onTodaySelect} className="text-indigo-600 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">امروز</button>
            <span className="text-gray-400">{currentJalaliYear}/{String(currentJalaliMonth).padStart(2, '0')}/{String(currentJalaliDay).padStart(2, '0')}</span>
        </div>
    </div>
  );

  return ReactDOM.createPortal(calendarJsx, document.body);
};


// --- Main Date Picker Component ---
interface PersianDatePickerProps {
  value: string; // YYYY/MM/DD
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({ value, onChange, placeholder, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    if (inputRef.current) {
        setTargetRect(inputRef.current.getBoundingClientRect());
        setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDateSelect = (date: string) => {
    onChange(date);
    handleClose();
  };

  const handleToday = () => {
    const today = jalaali.toJalaali(new Date());
    const date = `${today.jy}/${String(today.jm).padStart(2, '0')}/${String(today.jd).padStart(2, '0')}`;
    onChange(date);
    handleClose();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        placeholder={placeholder}
        value={toPersianDigits(value)}
        onFocus={handleOpen}
        readOnly
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 sm:text-sm cursor-pointer"
        autoComplete="off"
      />
      {/* Hidden input for form validation */}
      <input type="hidden" value={value} required={required} readOnly style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '100%', height: '100%' }}/>

      {isOpen && targetRect && (
        <CalendarPortal
            onClose={handleClose}
            onDateSelect={handleDateSelect}
            onTodaySelect={handleToday}
            initialValue={value}
            targetRect={targetRect}
        />
      )}
    </div>
  );
};
export default PersianDatePicker;