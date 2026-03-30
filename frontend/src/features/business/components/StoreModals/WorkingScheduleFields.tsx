import React from 'react';
import {
  DAYS_ORDER,
  type DayOfWeekKey,
  type WorkingSchedule,
} from '../../utils/workingSchedule';
import styles from './Modal.module.css';

const DAY_LABELS: Record<DayOfWeekKey, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

interface WorkingScheduleFieldsProps {
  value: WorkingSchedule;
  onChange: (next: WorkingSchedule) => void;
}

const WorkingScheduleFields: React.FC<WorkingScheduleFieldsProps> = ({ value, onChange }) => {
  const updateDay = (d: DayOfWeekKey, patch: Partial<WorkingSchedule[DayOfWeekKey]>) => {
    onChange({ ...value, [d]: { ...value[d], ...patch } });
  };

  return (
    <div className={styles.manageSection} style={{ marginTop: '1rem' }}>
      <div className={styles.sectionHeader}>
        <h3>Working hours</h3>
        <p className={styles.helpText}>Required: enable at least one day with open and close times.</p>
      </div>
      <div className={styles.workingDaysList}>
        {DAYS_ORDER.map((d) => (
          <div key={d} className={styles.workingDayRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={value[d].enabled}
                onChange={(e) => updateDay(d, { enabled: e.target.checked })}
              />
              <span>{DAY_LABELS[d]}</span>
            </label>
            {value[d].enabled && (
              <div className={styles.workingTimeInputs}>
                <input
                  type="time"
                  value={value[d].openTime}
                  onChange={(e) => updateDay(d, { openTime: e.target.value })}
                  aria-label={`${DAY_LABELS[d]} opens`}
                />
                <span className={styles.workingTimeSep}>–</span>
                <input
                  type="time"
                  value={value[d].closeTime}
                  onChange={(e) => updateDay(d, { closeTime: e.target.value })}
                  aria-label={`${DAY_LABELS[d]} closes`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkingScheduleFields;
