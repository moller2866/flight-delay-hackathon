import { useMemo, useState, type FormEvent } from 'react'
import './App.css'
import { useAirports } from './hooks/useAirports'
import { requestPrediction, ApiError } from './api'
import type { PredictionRequest, PredictionResponse } from './types'
import { AirportSelect } from './components/AirportSelect'
import { WeekdaySelect, WEEKDAYS } from './components/WeekdaySelect'
import { PredictionResult } from './components/PredictionResult'
import { ErrorBanner } from './components/ErrorBanner'
import { Loader } from './components/Loader'

type SubmitStatus = 'idle' | 'submitting'

function App() {
  const { airports, isLoading, isError, error: airportsError, refetch } = useAirports()

  const [selectedAirportId, setSelectedAirportId] = useState<number | ''>('')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [carrier, setCarrier] = useState('')
  const [originAirportId, setOriginAirportId] = useState('')
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [predictionError, setPredictionError] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmitStatus>('idle')

  const isSubmitDisabled =
    status === 'submitting' || selectedAirportId === '' || selectedDay === null

  const dayLabel = useMemo(
    () => WEEKDAYS.find((day) => day.value === selectedDay)?.label ?? 'the selected day',
    [selectedDay],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedAirportId === '' || selectedDay === null) {
      setPredictionError('Please pick both an airport and a day before submitting.')
      return
    }

    setStatus('submitting')
    setPredictionError(null)

    try {
      const originValue = originAirportId.trim()
      const parsedOrigin = originValue ? Number(originValue) : undefined
      const payload: PredictionRequest = {
        airport_id: Number(selectedAirportId),
        day_of_week: selectedDay,
        ...(carrier.trim() ? { carrier: carrier.trim().toUpperCase() } : {}),
        ...(typeof parsedOrigin === 'number' && Number.isFinite(parsedOrigin)
          ? { origin_airport_id: parsedOrigin }
          : {}),
      }

      const result = await requestPrediction(payload)
      setPrediction(result)
    } catch (error) {
      console.error('Prediction request failed', error)
      if (error instanceof ApiError) {
        if (error.payload && typeof error.payload === 'object' && 'errors' in error.payload) {
          const errors = error.payload.errors as Record<string, string>
          const combined = Object.values(errors).join('\n')
          setPredictionError(combined || error.message)
        } else {
          setPredictionError(error.message)
        }
      } else if (error instanceof Error) {
        setPredictionError(error.message)
      } else {
        setPredictionError('Something went wrong. Please try again.')
      }
    } finally {
      setStatus('idle')
    }
  }

  const handleReset = () => {
    setPrediction(null)
    setPredictionError(null)
  }

  const formDescription = useMemo(() => {
    if (prediction) {
      return `Showing prediction for ${dayLabel}.`
    }
    return 'Select a day and airport to check the likelihood of arrival delays.'
  }, [prediction, dayLabel])

  return (
    <div className="page">
      <header className="hero">
        <h1>Flight delay checker</h1>
        <p>{formDescription}</p>
      </header>

      {isError && airportsError && <ErrorBanner message={airportsError} onRetry={refetch} />}

      <main>
        <form className="prediction-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <WeekdaySelect value={selectedDay} onChange={setSelectedDay} />
            <AirportSelect
              airports={airports}
              value={selectedAirportId}
              onChange={setSelectedAirportId}
              disabled={isLoading}
            />
          </div>

          <div className="form-grid optional-fields">
            <div className="field">
              <label htmlFor="carrier">Carrier (optional)</label>
              <input
                id="carrier"
                name="carrier"
                placeholder="e.g., DL"
                value={carrier}
                onChange={(event) => setCarrier(event.target.value)}
                maxLength={6}
                autoComplete="off"
              />
              <p className="field__hint">Two-letter airline code. Defaults to UNKNOWN.</p>
            </div>

            <div className="field">
              <label htmlFor="origin">Origin airport ID (optional)</label>
              <input
                id="origin"
                name="origin"
                placeholder="e.g., 12892"
                value={originAirportId}
                onChange={(event) => setOriginAirportId(event.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                autoComplete="off"
              />
              <p className="field__hint">Numeric airport identifier if you know it.</p>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitDisabled}>
              {status === 'submitting' ? 'Checking…' : 'Check delay odds'}
            </button>
            {status === 'submitting' && <Loader message="Contacting the prediction service…" />}
          </div>

          {predictionError && <ErrorBanner message={predictionError} />}
        </form>

        {isLoading && <Loader message="Loading airports…" />}

      {!isLoading && !isError && airports.length === 0 && (
        <ErrorBanner message="No airports available yet. Try refreshing the list." onRetry={refetch} />
      )}

        {prediction && <PredictionResult result={prediction} onReset={handleReset} />}
      </main>
    </div>
  )
}

export default App
