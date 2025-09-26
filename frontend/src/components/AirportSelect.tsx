import type { ChangeEvent } from 'react'
import type { Airport } from '../types'
import './Field.css'

interface AirportSelectProps {
  airports: Airport[]
  value: number | ''
  onChange: (value: number | '') => void
  disabled?: boolean
}

export function AirportSelect({ airports, value, onChange, disabled }: AirportSelectProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value
    onChange(selectedValue ? Number(selectedValue) : '')
  }

  return (
    <div className="field">
      <label htmlFor="airport">Destination airport</label>
      <select
        id="airport"
        name="airport"
        value={value === '' ? '' : String(value)}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="" disabled>
          {disabled ? 'Loading airports…' : 'Select an airport'}
        </option>
        {airports.map((airport) => (
          <option key={airport.airport_id} value={airport.airport_id}>
            {airport.airport_name}
          </option>
        ))}
      </select>
      <p className="field__hint">Choose the arrival airport you plan to fly into.</p>
    </div>
  )
}
