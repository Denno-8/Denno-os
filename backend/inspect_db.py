import sqlite3

conn = sqlite3.connect("denno_dev.db")
conn.row_factory = sqlite3.Row
cur = conn.cursor()

print("=== APPLICATIONS ===")
cur.execute("SELECT id, user_id, company_name, role, stage, source_job_id, date_applied FROM applications ORDER BY id")
for a in cur.fetchall():
    print(dict(a))

print("\n=== USERS ===")
cur.execute("SELECT id, email, role FROM users")
for u in cur.fetchall():
    print("USER:", dict(u))

print("\n=== JOB COUNTS ===")
cur.execute("SELECT COUNT(*) FROM jobs")
print("Total jobs:", cur.fetchone()[0])
cur.execute("SELECT COUNT(*) FROM jobs WHERE source_url LIKE 'http%'")
print("Jobs with real URLs:", cur.fetchone()[0])

conn.close()
