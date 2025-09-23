import React from 'react';
import PersianDatePicker from './PersianDatePicker';
import jalaali from 'jalaali-js';

interface PersianDateTimePickerProps {
  label: string;
  value: string; // ISO 8601 string
  onChange: (value: string) => void;
  required?: boolean;
}

const toShamsiDate = (isoString: string): string => {
    if (!isoString || isNaN(new Date(isoString).getTime())) return '';
    const date = new Date(isoString);
    const { jy, jm, jd } = jalaali.toJalaali(date);
    return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
};

const toTime = (isoString: string): string => {
    if (!isoString || isNaN(new Date(isoString).getTime())) return '';
    const date = new Date(isoString);
    // Use getHours() and getMinutes() which are relative to the user's local timezone.
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const toISO = (shamsiDate: string, time: string): string => {
    if (!shamsiDate || !time) return '';
    try {
        const [y, m, d] = shamsiDate.split('/').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        if(isNaN(y) || isNaN(m) || isNaN(d) || isNaN(hours) || isNaN(minutes)) return '';

        const gregorian = jalaali.toGregorian(y, m, d);
        // This creates a Date object interpreted in the user's local timezone.
        const localDate = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd, hours, minutes);
        
        // .toISOString() correctly converts the local time to UTC and formats it.
        return localDate.toISOString();
    } catch {
        return '';
    }
};


const PersianDateTimePicker: React.FC<PersianDateTimePickerProps> = ({ label, value, onChange, required }) => {
    // By deriving date and time parts directly from the `value` prop,
    // we eliminate internal state and prevent bugs related to stale state.
    const datePart = toShamsiDate(value);
    const timePart = toTime(value);

    const handleDateChange = (newDatePart: string) => {
        // When the date changes, we must combine it with the existing time part.
        // If the existing time part is empty (e.g., initial value was null),
        // we provide a sensible default to ensure a full ISO string can be created.
        const effectiveTime = timePart || '00:00';
        onChange(toISO(newDatePart, effectiveTime));
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTimePart = e.target.value;
        // When the time changes, we must combine it with the existing date part.
        // If the existing date is empty, we default to today's date.
        let effectiveDate = datePart;
        if (!effectiveDate) {
            const today = jalaali.toJalaali(new Date());
            effectiveDate = `${today.jy}/${String(today.jm).padStart(2, '0')}/${String(today.jd).padStart(2, '0')}`;
        }
        onChange(toISO(effectiveDate, newTimePart));
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <div className="w-1/2">
                    <PersianDatePicker
                        value={datePart}
                        onChange={handleDateChange}
                        placeholder="تاریخ"
                        required={required}
                    />
                </div>
                <div className="w-1/2">
                    <input
                        type="time"
                        value={timePart}
                        onChange={handleTimeChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 sm:text-sm"
                        required={required}
                    />
                </div>
            </div>
        </div>
    );
};

export default PersianDateTimePicker;