import assert from 'node:assert/strict'
import test from 'node:test'
import { validateProductAnalyticsEventBody } from './productAnalytics.mjs'

const IDS = Object.freeze({
  eventId: '11111111-1111-4111-8111-111111111111',
  anonymousId: '22222222-2222-4222-8222-222222222222',
  sessionId: '33333333-3333-4333-8333-333333333333',
})

function createEventBody({
  eventName,
  resource,
  path = '/prompt/123',
  metadata = {},
}) {
  return {
    ...IDS,
    eventName,
    resource,
    path,
    locale: 'en',
    occurredAt: '2026-09-12T00:00:00.000Z',
    metadata,
  }
}

test('existing prompt archive analytics contract remains valid', () => {
  const validation = validateProductAnalyticsEventBody(createEventBody({
    eventName: 'prompt_archive_view',
    resource: {
      type: 'prompt_archive_item',
      id: '123',
    },
    metadata: {
      source: 'api',
    },
  }))

  assert.deepEqual(validation.errors, [])
  assert.equal(validation.event?.eventName, 'prompt_archive_view')
  assert.equal(validation.event?.resourceType, 'prompt_archive_item')
  assert.equal(validation.event?.resourceId, '123')
})

test('public prompt acquisition and intent events accept public prompt resources', () => {
  for (const eventName of [
    'public_prompt_view',
    'prompt_copy_clicked',
    'prompt_unlock_clicked',
  ]) {
    const validation = validateProductAnalyticsEventBody(createEventBody({
      eventName,
      resource: {
        type: 'public_prompt',
        id: '123',
      },
    }))

    assert.deepEqual(validation.errors, [], eventName)
    assert.equal(validation.event?.eventName, eventName)
    assert.equal(validation.event?.resourceType, 'public_prompt')
    assert.equal(validation.event?.resourceId, '123')
  }
})

test('public creator view accepts a normalized public creator username', () => {
  const validation = validateProductAnalyticsEventBody(createEventBody({
    eventName: 'public_creator_view',
    resource: {
      type: 'public_creator',
      id: 'creator.name',
    },
    path: '/creator/creator.name',
  }))

  assert.deepEqual(validation.errors, [])
  assert.equal(validation.event?.eventName, 'public_creator_view')
  assert.equal(validation.event?.resourceType, 'public_creator')
  assert.equal(validation.event?.resourceId, 'creator.name')
})

test('public analytics events reject mismatched resource types', () => {
  const validation = validateProductAnalyticsEventBody(createEventBody({
    eventName: 'public_prompt_view',
    resource: {
      type: 'prompt_archive_item',
      id: '123',
    },
  }))

  assert.equal(validation.event, null)
  assert.deepEqual(validation.errors, [
    {
      field: 'resource.type',
      message: 'resource.type must be public_prompt',
    },
  ])
})

test('trusted conversion events remain unavailable to the public analytics endpoint', () => {
  for (const eventName of ['prompt_unlock_completed', 'goin_spent']) {
    const validation = validateProductAnalyticsEventBody(createEventBody({
      eventName,
      resource: {
        type: 'public_prompt',
        id: '123',
      },
    }))

    assert.equal(validation.event, null)
    assert.deepEqual(validation.errors, [
      {
        field: 'eventName',
        message: 'eventName is not allowed',
      },
    ], eventName)
  }
})
