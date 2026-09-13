import { getCampaignMetric } from './campaignRegistry.mjs'

const METRIC_OPERATORS = new Set(['eq','gte','gt','lte','lt'])
const WINDOWS = new Set(['lifetime','campaign','since_participation'])

function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) }
function issue(path, code, message) { return { path, code, message } }

export function validateRuleExpression(rule, path = 'rule') {
  const errors = []

  function walk(node, currentPath) {
    if (!isObject(node)) {
      errors.push(issue(currentPath, 'CAMPAIGN_RULE_INVALID', 'Rule node must be an object'))
      return
    }

    if (node.type === 'all' || node.type === 'any') {
      if (!Array.isArray(node.rules) || node.rules.length === 0) {
        errors.push(issue(`${currentPath}.rules`, 'CAMPAIGN_RULES_REQUIRED', `${node.type} requires at least one nested rule`))
        return
      }
      node.rules.forEach((child, index) => walk(child, `${currentPath}.rules[${index}]`))
      return
    }

    if (node.type === 'not') {
      if (!node.rule) errors.push(issue(`${currentPath}.rule`, 'CAMPAIGN_RULE_REQUIRED', 'not requires one nested rule'))
      else walk(node.rule, `${currentPath}.rule`)
      return
    }

    if (node.type !== 'condition' || !isObject(node.condition)) {
      errors.push(issue(currentPath, 'CAMPAIGN_RULE_TYPE_INVALID', 'Rule type must be all, any, not, or condition'))
      return
    }

    const condition = node.condition
    if (condition.source === 'metric') {
      const metric = getCampaignMetric(condition.metricKey)
      if (!metric) errors.push(issue(`${currentPath}.condition.metricKey`, 'CAMPAIGN_METRIC_UNKNOWN', 'Metric key is not registered'))
      if (!METRIC_OPERATORS.has(condition.operator)) errors.push(issue(`${currentPath}.condition.operator`, 'CAMPAIGN_OPERATOR_INVALID', 'Metric operator is invalid'))
      if (!Number.isFinite(condition.value)) errors.push(issue(`${currentPath}.condition.value`, 'CAMPAIGN_METRIC_VALUE_INVALID', 'Metric comparison value must be numeric'))
      if (!WINDOWS.has(condition.window)) errors.push(issue(`${currentPath}.condition.window`, 'CAMPAIGN_WINDOW_INVALID', 'Metric window is invalid'))
      if (metric && !metric.supportedWindows.includes(condition.window)) errors.push(issue(`${currentPath}.condition.window`, 'CAMPAIGN_WINDOW_UNSUPPORTED', 'Metric does not support this window'))
      return
    }

    if (condition.source === 'mechanic_outcome') {
      if (typeof condition.mechanicId !== 'string' || !condition.mechanicId.trim()) errors.push(issue(`${currentPath}.condition.mechanicId`, 'CAMPAIGN_MECHANIC_ID_REQUIRED', 'Mechanic outcome requires mechanicId'))
      if (typeof condition.outcome !== 'string' || !condition.outcome.trim()) errors.push(issue(`${currentPath}.condition.outcome`, 'CAMPAIGN_MECHANIC_OUTCOME_REQUIRED', 'Mechanic outcome requires outcome'))
      return
    }

    errors.push(issue(`${currentPath}.condition.source`, 'CAMPAIGN_CONDITION_SOURCE_INVALID', 'Condition source must be metric or mechanic_outcome'))
  }

  walk(rule, path)
  return errors
}

export async function evaluateRuleExpression(rule, context) {
  if (rule.type === 'all') return (await Promise.all(rule.rules.map(item => evaluateRuleExpression(item, context)))).every(Boolean)
  if (rule.type === 'any') return (await Promise.all(rule.rules.map(item => evaluateRuleExpression(item, context)))).some(Boolean)
  if (rule.type === 'not') return !(await evaluateRuleExpression(rule.rule, context))

  const condition = rule.condition
  if (condition.source === 'mechanic_outcome') {
    return Boolean(await context.hasMechanicOutcome(condition.mechanicId, condition.outcome))
  }

  const actual = Number(await context.resolveMetric(condition.metricKey, condition.window))
  const expected = Number(condition.value)
  if (condition.operator === 'eq') return actual === expected
  if (condition.operator === 'gte') return actual >= expected
  if (condition.operator === 'gt') return actual > expected
  if (condition.operator === 'lte') return actual <= expected
  if (condition.operator === 'lt') return actual < expected
  return false
}
