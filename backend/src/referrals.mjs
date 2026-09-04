import { queryDatabase } from './database.mjs'

export async function getReferralState(userId) {
  if (!userId) {
    throw new Error('Referral state requires userId')
  }

  const result = await queryDatabase(
    `
      SELECT COUNT(*)::int AS "referredCount"
      FROM referrals
      WHERE referrer_user_id = $1
    `,
    [userId],
  )

  return {
    referredCount: Number(result.rows[0]?.referredCount ?? 0),
  }
}
