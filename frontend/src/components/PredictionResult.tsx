import type { PredictionResponse } from '../types'
import './PredictionResult.css'

interface PredictionResultProps {
  result: PredictionResponse
  onReset: () => void
}

const formatPercent = (value: number) => `${value.toFixed(1)}%`

export function PredictionResult({ result, onReset }: PredictionResultProps) {
  const { prediction, delay_probability_percent, model_confidence_percent } = result
  const isDelayed = prediction === 'delayed'

  return (
    <section className="prediction-card" aria-live="polite">
      <header>
        <h2>Prediction</h2>
        <p className={`prediction-card__badge prediction-card__badge--${prediction}`}>
          {isDelayed ? 'Likely delayed' : 'Likely on time'}
        </p>
      </header>
      <dl>
        <div>
          <dt>Delay probability</dt>
          <dd>{formatPercent(delay_probability_percent)}</dd>
        </div>
        <div>
          <dt>Model confidence</dt>
          <dd>{formatPercent(model_confidence_percent)}</dd>
        </div>
      </dl>
      <div className="prediction-card__footer">
        <button type="button" className="secondary" onClick={onReset}>
          Check another flight
        </button>
      </div>
    </section>
  )
}
