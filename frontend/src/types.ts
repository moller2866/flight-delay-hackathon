export interface Airport {
  airport_id: number
  airport_name: string
}

export interface PredictionRequest {
  airport_id: number
  day_of_week: number
  carrier?: string
  origin_airport_id?: number
}

export interface PredictionResponse {
  input: PredictionRequest & {
    airport_id: number
    day_of_week: number
    carrier: string
    origin_airport_id: number
  }
  prediction: 'delayed' | 'on_time'
  delay_probability: number
  delay_probability_percent: number
  model_confidence_percent: number
}

export interface ApiErrorPayload {
  errors?: Record<string, string>
  message?: string
  detail?: string
}
