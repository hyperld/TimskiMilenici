import React, { useState } from 'react';
import styles from './Calendar.module.css';
import Button from '../../../../shared/components/Button/Button';

interface CalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  unavailableDates?: string[];
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, unavailableDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const days: React.ReactNode[] = [];
  const totalDays = daysInMonth(year, month);
  const offset = firstDayOfMonth(year, month);

  // Previous month padding
  for (let i = 0; i < offset; i++) {
    days.push(<div key={`empty-${i}`} className={`${styles.calendarDay} ${styles.empty}`}></div>);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const isUnavailable = unavailableDates.includes(dateStr);
    const dateObj = new Date(year, month, d);
    const isPast = dateObj < today;
    const isSelected = selectedDate === dateStr;

    let dayClasses = [styles.calendarDay];
    if (isPast) dayClasses.push(styles.past);
    else if (isUnavailable) dayClasses.push(styles.unavailable);
    else dayClasses.push(styles.available);
    
    if (isSelected) dayClasses.push(styles.selected);

    days.push(
      <div 
        key={d} 
        className={dayClasses.join(' ')}
        onClick={() => !isPast && !isUnavailable && onDateSelect(dateStr)}
      >
        {d}
      </div>
    );
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <Button variant="ghost" size="sm" type="button" onClick={prevMonth}>&lt;</Button>
        <h3>{monthNames[month]} {year}</h3>
        <Button variant="ghost" size="sm" type="button" onClick={nextMonth}>&gt;</Button>
      </div>
      <div className={styles.calendarWeekdays}>
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      <div className={styles.calendarGrid}>
        {days}
      </div>
      <div className={styles.calendarLegend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.available}`}></span> Available
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.unavailable}`}></span> Unavailable
        </div>
      </div>
    </div>
  );
};

export default Calendar;
