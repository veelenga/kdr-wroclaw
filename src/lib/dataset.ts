import { useEffect, useState } from 'react'
import type { Dataset } from '../types.ts'

export const DATASET_URL = `${import.meta.env.BASE_URL}data/partners.json`

export type DatasetState =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: Dataset }

export function useDataset(): DatasetState {
  const [state, setState] = useState<DatasetState>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    fetch(DATASET_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<Dataset>
      })
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setState({ status: 'error', message: error.message })
      })
    return () => controller.abort()
  }, [])
  return state
}
