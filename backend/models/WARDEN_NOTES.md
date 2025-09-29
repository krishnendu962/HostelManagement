WardenModel notes

Assumptions:

- Wardens are represented in the `users` table with `role = 'Warden'`.
- There is no separate `wardens` table in the schema; therefore the model operates on the `users` table and the `hostels` table for assignments.
- Supabase client is used throughout (the project prints a warning if SUPABASE_URL/SUPABASE_KEY are not set).

Provided functionality in `WardenModel`:

- findByUserId(userId): return the user row if role is 'Warden'.
- findAllWardens(): list public warden fields (no password hash).
- findWithHostels(userId): fetch warden with related hostels using Supabase's multi-select.
- assignToHostel(userId, hostelId): update `hostels.warden_id` to the given user.
- unassignFromHostel(hostelId): set `hostels.warden_id` to null.

Recommended next steps:

- Add backend routes under `backend/routes/` to manage wardens (create, list, assign/unassign) and protect them with existing `middleware/auth.js`.
- Add frontend UI pages (or extend `warden-dashboard.html`) to allow superadmins to assign wardens to hostels.
- Add unit tests for model methods (mock supabase responses) or integration tests against a test Supabase/project database.
- Consider adding data validation (e.g., ensure user is of role 'Warden' before assigning) and conflict checks (e.g., one warden per hostel or multiple allowed as per policy).
