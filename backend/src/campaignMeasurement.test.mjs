import test from 'node:test'
import assert from 'node:assert/strict'
import { mapCampaignMeasurementRow } from './campaignMeasurement.mjs'

const ACTIVE_DEFINITION = {
  lifecycle: {
    startsAt: '2026-09-01T00:00:00.000Z',
    endsAt: '2099-09-30T00:00:00.000Z',
  },
}

test('maps current-version authoritative and observational measurements separately', () => {
  const summary = mapCampaignMeasurementRow({
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'autumn-game',
    versionId: '22222222-2222-4222-8222-222222222222',
    versionNumber: '3',
    definition: ACTIVE_DEFINITION,
    pausedAt: null,
    manuallyEndedAt: null,
    archivedAt: null,
    participants: '120',
    completed: '80',
    qualified: '70',
    rewarded: '65',
    goinGranted: '6500',
    grantCount: '65',
    failedGrantCount: '5',
    budgetMax: '10000',
    budgetCommitted: '7000',
    budgetGranted: '6500',
    promotionImpressions: '900',
    promotionClicks: '240',
  })

  assert.equal(summary.campaign.version, 3)
  assert.equal(summary.campaign.status, 'active')
  assert.equal(summary.funnel.landingViews, null)
  assert.deepEqual(summary.funnel, {
    landingViews: null,
    participants: 120,
    completed: 80,
    qualified: 70,
    rewarded: 65,
  })
  assert.equal(summary.rewards.budgetRemaining, 3000)
  assert.equal(summary.rewards.goinGranted, 6500)
  assert.equal(summary.analytics.authority, 'observational')
  assert.equal(summary.analytics.promotionImpressions, 900)
  assert.equal(summary.analytics.promotionClicks, 240)
  assert.equal(summary.analytics.landingViewsInstrumented, false)
})

test('keeps absent published version and budget distinguishable from numeric zero', () => {
  const summary = mapCampaignMeasurementRow({
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'draft-campaign',
    versionId: null,
    versionNumber: null,
    definition: null,
    pausedAt: null,
    manuallyEndedAt: null,
    archivedAt: null,
    participants: '0',
    completed: '0',
    qualified: '0',
    rewarded: '0',
    goinGranted: '0',
    grantCount: '0',
    failedGrantCount: '0',
    budgetMax: null,
    budgetCommitted: null,
    budgetGranted: null,
    promotionImpressions: '0',
    promotionClicks: '0',
  })

  assert.equal(summary.campaign.version, null)
  assert.equal(summary.campaign.status, 'draft')
  assert.equal(summary.scope.campaignVersionId, null)
  assert.equal(summary.rewards.budgetMax, null)
  assert.equal(summary.rewards.budgetCommitted, null)
  assert.equal(summary.rewards.budgetGranted, null)
  assert.equal(summary.rewards.budgetRemaining, null)
})
