import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const indexSource = await readFile(new URL('./index.mjs', import.meta.url), 'utf8')

test('API entrypoint wires canonical public Prompt, Creator, and inventory handlers', () => {
  for (const [handler, modulePath] of [
    ['handlePublicPromptRequest', './publicPrompt.mjs'],
    ['handlePublicCreatorRequest', './publicCreator.mjs'],
    ['handlePublicInventoryRequest', './publicInventory.mjs'],
  ]) {
    assert.ok(
      indexSource.includes(`import { ${handler} } from '${modulePath}'`),
      `${handler} must be imported by backend/src/index.mjs`,
    )
    assert.ok(
      indexSource.includes(`await ${handler}({`),
      `${handler} must be dispatched by backend/src/index.mjs`,
    )
  }
})
