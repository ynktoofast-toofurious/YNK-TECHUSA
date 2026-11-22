/** Side-effect-free rule tests. Run publicationScheduleRuleTests_ in Apps Script.
 * Staging acceptance (owner, before production):
 * 1. Push reviewed files from VS Code, open /dev, confirm default paused and 0/7 registered.
 * 2. Select seven real unpublished queue rows; register and verify all seven slot/time cells.
 *    Expected Central times: Nov 16 noon, 3 PM, 6 PM, 9 PM; Nov 17 midnight, 3 AM, 6 AM.
 * 3. Preview EN/FR/ES and all three original illustrations. Test missing caption, source,
 *    original rights, review approval and authorization: each must block release.
 * 4. Reject a reschedule within three hours of another slot. Confirm pause blocks both
 *    autoPublish and manual approval. Resume only after all content has passed review.
 * 5. In a sandbox project and repository, advance a due slot; confirm one isolated PR,
 *    required GitHub checks, one merge, published_at, and no second release for three hours.
 * 6. Repeat the trigger and simulate an ambiguous merge response: receipt blocks duplicates.
 *    Inspect the PR and PUBLICATION_RECEIPT_* before owner reconciliation. Never blindly
 *    remove a pending receipt. A failed request retains LAST_RELEASE_AT conservatively.
 * 7. Verify the content build indexes every published article, EN/FR/ES reader URLs, cover
 *    and body images. Homepage shows its existing latest-three selection, /latest lists all.
 * No production deployment or publication is authorized by running these tests.
 */
function publicationScheduleRuleTests_() {
  let passed = 0
  const check = (ok, name) => { if (!ok) throw new Error(`Schedule test failed: ${name}`); passed++ }
  const rejects = (fn, name) => { let rejected = false; try { fn() } catch (e) { rejected = true }; check(rejected, name) }
  check(RELEASE_START === Date.parse('2026-11-16T18:00:00Z'), 'Central noon conversion')
  check(RELEASE_GAP_MS === 10800000, 'three-hour minimum')
  const slots = Array.from({ length: 7 }, (_, i) => RELEASE_START + i * RELEASE_GAP_MS)
  check(new Set(slots).size === 7, 'seven distinct slots')
  check(new Date(slots[6]).toISOString() === '2026-11-17T12:00:00.000Z', 'last slot is Central 6 AM')
  scheduleValidateSpacing_(slots)
  passed++
  scheduleValidateSpacing_(slots.slice().reverse())
  passed++
  rejects(() => scheduleValidateSpacing_([0, RELEASE_GAP_MS - 1]), 'one millisecond too close')
  rejects(() => scheduleValidateSpacing_([RELEASE_START, RELEASE_START]), 'duplicate timestamp')
  rejects(() => scheduleTime_('invalid'), 'invalid timestamp')
  check(scheduleTime_('2026-11-17T00:00:00-06:00') === Date.parse('2026-11-17T06:00:00Z'), 'Central midnight conversion')
  check(scheduleTime_('') === 0, 'absent timestamp')
  return { passed }
}
