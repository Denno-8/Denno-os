import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "denno_dev.db")
if not os.path.exists(db_path):
    print("SQLite DB not found at", db_path)
else:
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    cur.execute("UPDATE jobs SET source_url = REPLACE(source_url, 'campusbizz.com', 'campusbizz.co.ke') WHERE source_url LIKE '%campusbizz.com%'")
    r1 = cur.rowcount
    cur.execute("UPDATE jobs SET contact_email = REPLACE(contact_email, 'campusbizz.com', 'campusbizz.co.ke') WHERE contact_email LIKE '%campusbizz.com%'")
    r2 = cur.rowcount
    cur.execute("UPDATE job_sources SET url = REPLACE(url, 'campusbizz.com', 'campusbizz.co.ke') WHERE url LIKE '%campusbizz.com%'")
    r3 = cur.rowcount
    cur.execute("UPDATE companies SET career_url = REPLACE(career_url, 'campusbizz.com', 'campusbizz.co.ke'), contact_email = REPLACE(contact_email, 'campusbizz.com', 'campusbizz.co.ke') WHERE career_url LIKE '%campusbizz.com%' OR contact_email LIKE '%campusbizz.com%'")
    r4 = cur.rowcount
    con.commit()
    con.close()
    print(f"Fixed: {r1} job urls, {r2} job emails, {r3} source rows, {r4} company rows")
