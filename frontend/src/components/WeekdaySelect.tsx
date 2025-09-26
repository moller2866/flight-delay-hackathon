import type { ChangeEvent } from 'react'
import './Field.css'

export const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
] as const

interface WeekdaySelectProps {
  value: number | null
  onChange: (value: number) => void
}

export function WeekdaySelect({ value, onChange }: WeekdaySelectProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value))
  }

  return (
    <fieldset className="field">
      <legend>Day of week</legend>
      <div className="weekday-grid">
        {WEEKDAYS.map((weekday) => (
          <label key={weekday.value} className="weekday-option">
            <input
              type="radio"
              name="day-of-week"
              value={weekday.value}
              checked={value === weekday.value}
              onChange={handleChange}
            />
            <span>{weekday.label}</span>
          </label>
        ))}
      </div>
      <p className="field__hint">Select the departure day for your flight.</p>
    </fieldset>
  )
}
