import { runDeveloperSolver } from './developerSolver'
import { SolverWorkerRequest, SolverWorkerResponse } from './types'

interface WorkerScope {
  onmessage: ((event: MessageEvent<SolverWorkerRequest>) => void) | null
  postMessage(message: SolverWorkerResponse): void
}

const workerScope = self as unknown as WorkerScope

workerScope.onmessage = (event) => {
  if (event.data.type !== 'solve') return

  try {
    const result = runDeveloperSolver(
      event.data.initialState,
      event.data.options,
    )
    workerScope.postMessage({ type: 'result', result })
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown solver error.',
    })
  }
}
