# Migration Guide: Adding All Participant Emails

## Step-by-Step Migration Instructions

### 1. Apply Database Migration (REQUIRED)

**Login to Supabase Dashboard:**
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of: `supabase/migrations/005_add_all_participant_emails.sql`
5. Click **Run** (or press Ctrl+Enter)

**Expected Output:**
```
ALTER TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
COMMENT
COMMENT
COMMENT
```

**Verification:**
Run this query to verify the new columns exist:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inspections'
AND column_name IN ('tenant_email', 'landlord_email', 'inspector_email')
ORDER BY column_name;
```

Expected result:
| column_name      | data_type        | is_nullable |
|------------------|------------------|-------------|
| inspector_email  | character varying| YES         |
| landlord_email   | character varying| YES         |
| tenant_email     | character varying| YES         |

### 2. Deploy Code Changes (AUTOMATIC)

All code changes have been completed:
- TypeScript types updated
- API validation enhanced
- UI components refactored

**If using Git:**
```bash
git add .
git commit -m "feat(inspections): add email collection for all participants"
git push
```

**If using Vercel/Netlify:**
Your deployment will automatically pick up the changes.

### 3. Test the Implementation

#### Test Case 1: Create New Inspection with All Emails
1. Navigate to **Dashboard → Vistorias → Nova Vistoria**
2. Complete Step 1 (select property)
3. Complete Step 2 (select type)
4. In Step 3, observe the new organized layout:
   - Vistoriador section (purple border)
   - Locatário section (blue border)
   - Proprietário section (amber border)
   - Agendamento section
5. Fill in all email fields
6. Submit the form
7. Verify inspection is created successfully

#### Test Case 2: Create Inspection with Partial Data
1. Create new inspection
2. Fill only required fields (Inspector Name, Scheduled Date)
3. Leave all email fields empty
4. Submit successfully (emails are optional)

#### Test Case 3: View Existing Inspection
1. Navigate to any existing inspection details
2. Observe new "Participantes" section with organized display
3. Email fields should show "Não informado" or actual email if present

#### Test Case 4: Email Validation
1. Create new inspection
2. Enter invalid email format (e.g., "notanemail")
3. Should see validation error on submit
4. Correct to valid email format
5. Should submit successfully

### 4. Verify Data Integrity

Run this query to check existing inspections:
```sql
SELECT
  id,
  inspector_name,
  inspector_email,
  tenant_name,
  tenant_email,
  landlord_name,
  landlord_email
FROM inspections
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Behavior:**
- Old inspections: Email fields will be NULL
- New inspections: Email fields may contain values or NULL
- No data loss or corruption

### 5. Rollback Plan (If Needed)

If you need to rollback, run:
```sql
-- Remove new columns
ALTER TABLE inspections DROP COLUMN IF EXISTS landlord_email;
ALTER TABLE inspections DROP COLUMN IF EXISTS inspector_email;

-- Keep tenant_email if it was added by migration 004
-- Or remove it too:
-- ALTER TABLE inspections DROP COLUMN IF EXISTS tenant_email;
```

**Note:** This only affects the database. You'll need to revert code changes via Git.

## Common Issues and Solutions

### Issue 1: "Column already exists"
**Symptom:** Error when running migration
**Cause:** Migration 004 already added `tenant_email`
**Solution:** This is expected. Migration 005 uses `IF NOT EXISTS` and will skip existing columns.

### Issue 2: TypeScript errors after deployment
**Symptom:** Build fails with type errors
**Cause:** Cached types not refreshed
**Solution:**
```bash
rm -rf .next
npm run build
```

### Issue 3: Emails not showing in UI
**Symptom:** Email fields are empty even when filled
**Cause:** API not returning new fields
**Solution:** Clear cache and refresh:
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### Issue 4: Form validation too strict
**Symptom:** Can't submit form with empty emails
**Cause:** Frontend validation misconfigured
**Solution:** Verify all email fields are NOT marked as required in the form. Only `inspectorName` and `scheduledDate` should be required.

## Performance Notes

### Database Indexes
Three new indexes were created for email lookups:
- `idx_inspections_tenant_email`
- `idx_inspections_landlord_email`
- `idx_inspections_inspector_email`

These indexes enable fast lookups when filtering inspections by participant email in the future.

### Query Performance
No performance degradation expected:
- Indexes are partial (only non-NULL, non-deleted rows)
- VARCHAR(255) is lightweight
- No foreign key constraints added

## Next Features to Implement

With all emails collected, you can now build:

### 1. Email Notifications System
```typescript
// Example: Send report to all parties
async function sendReportToAll(inspectionId: string) {
  const inspection = await getInspection(inspectionId)

  const recipients = [
    inspection.inspector_email,
    inspection.tenant_email,
    inspection.landlord_email,
  ].filter(Boolean) // Remove null/undefined

  await sendEmail({
    to: recipients,
    subject: 'Laudo de Vistoria Pronto',
    template: 'inspection-report-ready',
    data: { inspection }
  })
}
```

### 2. Dispute Notifications
```typescript
// When tenant creates dispute
async function notifyDisputeCreated(disputeId: string) {
  const dispute = await getDisputeWithInspection(disputeId)

  // Notify landlord
  if (dispute.inspection.landlord_email) {
    await sendEmail({
      to: dispute.inspection.landlord_email,
      subject: 'Nova Contestação de Vistoria',
      template: 'dispute-created-landlord'
    })
  }

  // Notify inspector
  if (dispute.inspection.inspector_email) {
    await sendEmail({
      to: dispute.inspection.inspector_email,
      subject: 'Contestação Requer Revisão',
      template: 'dispute-created-inspector'
    })
  }
}
```

### 3. Participant Dashboards
- Tenant portal: Access via email link
- Landlord notifications center
- Inspector task list

## Success Criteria

Migration is successful if:
- [x] Database migration runs without errors
- [x] New inspections can be created with emails
- [x] Existing inspections still work normally
- [x] Details page shows all participant info
- [x] No TypeScript compilation errors
- [x] No runtime errors in console

## Support

If you encounter issues not covered here:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify migration was applied correctly
4. Review this guide's troubleshooting section

## Timeline

**Estimated time to complete migration:**
- Database migration: 1 minute
- Code deployment: 5-10 minutes (automatic)
- Testing: 10-15 minutes
- **Total: ~20 minutes**

## Validation Checklist

Before marking migration complete, verify:

- [ ] Migration 005 executed successfully
- [ ] New columns visible in Supabase dashboard
- [ ] Create new inspection with all emails (success)
- [ ] Create new inspection with no emails (success)
- [ ] View existing inspection details (no errors)
- [ ] View newly created inspection details (shows emails)
- [ ] Invalid email format rejected (validation works)
- [ ] TypeScript build completes without errors
- [ ] No console errors in browser
- [ ] No 500 errors in server logs

Once all items checked, migration is COMPLETE!
