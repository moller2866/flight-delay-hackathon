import type { Airport, PredictionRequest, PredictionResponse, ApiErrorPayload } from './types'

const DEFAULT_API_BASE_URL = 'http://localhost:5000'

class ApiError extends Error {
  status: number
  payload?: ApiErrorPayload | string | null

  constructor(message: string, status: number, payload?: ApiErrorPayload | string | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

const getApiBaseUrl = () => {
  const base = import.meta.env.VITE_API_BASE_URL
  return typeof base === 'string' && base.trim().length > 0 ? base : DEFAULT_API_BASE_URL
}

const parseJsonQuietly = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch (error) {
      console.warn('Failed to parse JSON response', error)
    }
  }
  return null
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.ok) {
    const payload = await parseJsonQuietly(response)
    return payload as T
  }

  const payload = await parseJsonQuietly(response)
  const messageFromPayload =
    (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
      ? payload.message
      : null) ?? response.statusText

  throw new ApiError(messageFromPayload, response.status, payload)
}

export const fetchAirports = async (): Promise<Airport[]> => {
  const response = await fetch(`${getApiBaseUrl()}/airports`)
  const payload = await handleResponse<{ airports: Airport[] }>(response)
  return payload?.airports ?? []
}

export const requestPrediction = async (
  body: PredictionRequest,
): Promise<PredictionResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/prediction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const payload = await handleResponse<PredictionResponse>(response)
  return payload
}

export { ApiError }
