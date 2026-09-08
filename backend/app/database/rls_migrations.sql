-- =============================================================================
-- Row-Level Security (RLS) Policies — Denno Career OS
-- =============================================================================
-- Run this ONCE against your PostgreSQL database as a superuser after the
-- initial schema migration has created all tables.
--
-- What this does:
--   1. Enables RLS on every user-owned table.
--   2. Creates a USING policy that restricts each row to the user whose
--      user_id matches the session variable `app.current_user_id`.
--   3. The app sets this variable at the start of every request (see
--      backend/app/database/postgresql.py's session event listener).
--
-- Effect: Even if the application layer has a bug that forgets to filter by
-- user_id, the database will return 0 rows for any other user's data.
--
-- How to apply:
--   psql -U postgres -d denno -f backend/app/database/rls_migrations.sql
-- =============================================================================

-- Helper function so policies can read the session variable safely.
-- Returns NULL (not 0) if the variable hasn't been set yet, which causes
-- the USING clause to evaluate to false and return no rows.
CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS INTEGER AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::INTEGER;
EXCEPTION WHEN others THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- =============================================================================
-- applications
-- =============================================================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS applications_user_isolation ON applications;
CREATE POLICY applications_user_isolation ON applications
    USING (user_id = current_app_user_id());


-- =============================================================================
-- notes
-- =============================================================================
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notes_user_isolation ON notes;
CREATE POLICY notes_user_isolation ON notes
    USING (user_id = current_app_user_id());


-- =============================================================================
-- goals
-- =============================================================================
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS goals_user_isolation ON goals;
CREATE POLICY goals_user_isolation ON goals
    USING (user_id = current_app_user_id());


-- =============================================================================
-- cv_versions
-- =============================================================================
ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_versions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cv_versions_user_isolation ON cv_versions;
CREATE POLICY cv_versions_user_isolation ON cv_versions
    USING (user_id = current_app_user_id());


-- =============================================================================
-- calendar_events
-- =============================================================================
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_events_user_isolation ON calendar_events;
CREATE POLICY calendar_events_user_isolation ON calendar_events
    USING (user_id = current_app_user_id());


-- =============================================================================
-- emails
-- =============================================================================
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS emails_user_isolation ON emails;
CREATE POLICY emails_user_isolation ON emails
    USING (user_id = current_app_user_id());


-- =============================================================================
-- interviews
-- =============================================================================
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interviews_user_isolation ON interviews;
CREATE POLICY interviews_user_isolation ON interviews
    USING (user_id = current_app_user_id());


-- =============================================================================
-- recruiters
-- =============================================================================
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recruiters_user_isolation ON recruiters;
CREATE POLICY recruiters_user_isolation ON recruiters
    USING (user_id = current_app_user_id());


-- =============================================================================
-- user_course_progress
-- =============================================================================
ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_progress FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_course_progress_user_isolation ON user_course_progress;
CREATE POLICY user_course_progress_user_isolation ON user_course_progress
    USING (user_id = current_app_user_id());


-- =============================================================================
-- notifications
-- =============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_user_isolation ON notifications;
CREATE POLICY notifications_user_isolation ON notifications
    USING (user_id = current_app_user_id());


-- =============================================================================
-- chat_sessions
-- =============================================================================
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_sessions_user_isolation ON chat_sessions;
CREATE POLICY chat_sessions_user_isolation ON chat_sessions
    USING (user_id = current_app_user_id());


-- =============================================================================
-- Admin bypass: the DB user the app connects with must be granted BYPASSRLS
-- only for admin-level service tasks (seeding, migrations). The regular app
-- connection role should NOT have BYPASSRLS.
-- =============================================================================
-- Example (run as superuser, only for a dedicated migration role):
-- ALTER ROLE denno_migrator BYPASSRLS;
-- The regular app role (e.g. 'denno_app') should NOT have BYPASSRLS.
