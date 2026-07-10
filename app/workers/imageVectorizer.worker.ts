/// <reference lib="webworker" />

import type {
  ImageVectorizerWorkerRequest,
  ImageVectorizerWorkerResponse,
} from '~/types/imageVectorizer'
import {
  ImageVectorizerPipelineError,
  vectorizeImage,
} from '~/utils/vectorizer/pipeline'

const workerScope = self as unknown as DedicatedWorkerGlobalScope

workerScope.onmessage = (event: MessageEvent<ImageVectorizerWorkerRequest>) => {
  const request = event.data

  if (!request || request.type !== 'vectorize') return

  try {
    const output = vectorizeImage(
      new Uint8ClampedArray(request.pixels),
      request.width,
      request.height,
      request.settings,
    )

    const previewBuffer = output.preview.pixels.buffer

    const response: ImageVectorizerWorkerResponse = {
      type: 'success',
      id: request.id,
      result: output.result,
      preview: {
        width: output.preview.width,
        height: output.preview.height,
        pixels: previewBuffer,
      },
    }

    workerScope.postMessage(response, [previewBuffer])
  } catch (error) {
    const pipelineError = error instanceof ImageVectorizerPipelineError
      ? error
      : null

    const response: ImageVectorizerWorkerResponse = {
      type: 'error',
      id: request.id,
      error: {
        code: pipelineError?.code || 'PROCESSING_FAILED',
        message: error instanceof Error
          ? error.message
          : 'Image vectorization failed.',
        detectedColorCount: pipelineError?.detectedColorCount,
        maxColors: pipelineError?.maxColors,
      },
    }

    workerScope.postMessage(response)
  }
}

export {}
