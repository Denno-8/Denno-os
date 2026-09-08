"""
Populates the `companies` collection with a much larger set of employers
than the prototype's original 60 — adds 40 more spanning telecom ISPs,
banking, insurtech, retail tech, ride-hailing, edtech, and remote-first
global employers that hire Kenyan engineers.

Idempotent: re-running upserts by company name instead of duplicating.

Usage:
    cd backend
    python -m scripts.seed_companies     # if PYTHONPATH includes backend/app
  or, from repo root with the backend venv active:
    python scripts/seed_companies.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402
from app.core.config import settings  # noqa: E402

# (name, sector, location, ats_platform, career_url, contact_email, tech_stack, open_roles, tier)
COMPANIES: list[tuple] = [
    # ── Original 60 (carried over from the prototype's demo dataset) ──
    ("Safaricom", "Telecom", "Westlands", "Workday", "https://www.safaricom.co.ke/about/careers", "careers@safaricom.co.ke", ["Java", "Kafka", "AWS", "K8s", "Python"], 9, 1),
    ("M-KOPA", "FinTech", "Upper Hill", "Greenhouse", "https://m-kopa.com/careers", "talent@m-kopa.com", ["Flutter", "Python", "AWS", "PostgreSQL"], 6, 1),
    ("Andela", "Tech Talent", "Remote", "Lever", "https://www.andela.com/careers", "apply@andela.com", ["React", "Node.js", "Go", "K8s", "Terraform"], 18, 1),
    ("Microsoft ADC", "Big Tech", "Westlands", "SmartRecruiters", "https://careers.microsoft.com", "msadc-careers@microsoft.com", ["Azure", "C#", "Python", "TypeScript", "ML"], 5, 1),
    ("Google Kenya", "Big Tech", "Westlands", "Google Hire", "https://careers.google.com", "africa-careers@google.com", ["Go", "Python", "GCP", "TensorFlow"], 4, 1),
    ("KCB Group", "Banking", "Upper Hill", "Oracle Taleo", "https://kcbgroup.com/careers", "recruitment@kcbgroup.com", ["Java", "Oracle", "T24", "MuleSoft"], 5, 1),
    ("Equity Bank", "Banking", "Upper Hill", "Oracle Taleo", "https://equitygroupholdings.com/ke/careers", "careers@equitybank.co.ke", ["Java", "Oracle", "T24", "PowerBI"], 5, 1),
    ("Flutterwave", "FinTech", "Remote", "Greenhouse", "https://flutterwave.com/us/careers", "talent@flutterwave.com", ["Node.js", "dbt", "BigQuery", "Kafka"], 7, 1),
    ("Deloitte EA", "Consulting", "Upper Hill", "Workday", "https://www2.deloitte.com/ke/en/careers.html", "ke-careers@deloitte.com", ["SAP", "Salesforce", "PowerBI", "Azure"], 6, 1),
    ("Twiga Foods", "AgriTech", "Industrial Area", "Lever", "https://twigafoods.com/careers", "hr@twigafoods.com", ["React", "Python", "Node.js", "PostgreSQL"], 4, 1),
    ("UNON", "UN Agency", "Gigiri", "Inspira", "https://inspira.un.org", "unon-recruit@un.org", ["SAP", "Oracle", "ServiceNow", "PowerBI"], 4, 2),
    ("Cellulant", "FinTech", "Westlands", "BambooHR", "https://cellulant.io/careers", "careers@cellulant.io", ["PHP", "Laravel", "React", "MySQL"], 5, 1),
    ("NCBA Bank", "Banking", "Westlands", "Internal", "https://www.ncbagroup.com/careers", "recruitment@ncbagroup.com", ["Java", "Python", "AWS", "React"], 4, 1),
    ("Bolt", "Mobility", "Westlands", "Greenhouse", "https://bolt.eu/en/careers", "africa.hiring@bolt.eu", ["Python", "Go", "React", "Kafka"], 5, 1),
    ("Jumia Kenya", "E-commerce", "Westlands", "Greenhouse", "https://careers.jumia.com", "careers.kenya@jumia.com", ["PHP", "Python", "React", "K8s"], 6, 1),
    ("IBM Research Africa", "Research", "Westlands", "IBM Kenexa", "https://www.ibm.com/employment", "africa-research@ibm.com", ["Python", "TensorFlow", "Watson", "K8s"], 3, 1),
    ("Absa Kenya", "Banking", "Westlands", "SuccessFactors", "https://www.absa.co.ke/about-us/careers", "kecareers@absa.africa", ["Java", "Python", "AWS", "React"], 5, 1),
    ("Apollo Agriculture", "AgriTech", "Westlands", "Lever", "https://apolloagriculture.com/careers", "hiring@apolloagriculture.com", ["Python", "React", "PostgreSQL", "GIS"], 4, 1),
    ("PwC Kenya", "Consulting", "Westlands", "Workday", "https://www.pwc.com/ke/en/careers.html", "ke_careers@pwc.com", ["SAP", "Power Platform", "Python", "Azure"], 5, 1),
    ("Huawei Kenya", "Telecom", "Parklands", "Internal", "https://huawei.com/en/talent", "hr.kenya@huawei.com", ["C", "C++", "Java", "5G", "Embedded"], 5, 1),
    ("Craft Silicon", "FinTech Software", "Parklands", "Internal", "https://craftsilicon.com/careers", "hr@craftsilicon.com", ["Java", "Android", "Swift", "Oracle"], 6, 1),
    ("UNICEF Kenya", "UN/NGO", "Gigiri", "Inspira", "https://www.unicef.org/careers", "nairobihro@unicef.org", ["PowerBI", "Kobo", "DHIS2", "Salesforce"], 3, 2),
    ("Standard Chartered", "Banking", "Westlands", "SuccessFactors", "https://www.sc.com/ke/careers", "ke.careers@sc.com", ["Java", "Python", "React", "AWS"], 4, 1),
    ("Wasoko", "B2B Commerce", "Westlands", "Greenhouse", "https://wasoko.com/careers", "jobs@wasoko.com", ["React Native", "Python", "PostgreSQL", "AWS"], 4, 1),
    ("BasiGo", "EV/CleanTech", "Karen", "Lever", "https://basigo.africa/careers", "careers@basigo.africa", ["Python", "React", "AWS", "IoT"], 4, 1),
    ("Sama", "AI Data", "Westlands", "Greenhouse", "https://www.sama.com/careers", "nairobi-careers@sama.com", ["Python", "TensorFlow", "CVAT"], 8, 1),
    ("Lori Systems", "Logistics Tech", "Kilimani", "Lever", "https://lorisystems.com/careers", "hiring@lorisystems.com", ["Python", "React", "Node.js", "PostgreSQL"], 4, 1),
    ("Accenture Kenya", "Consulting", "Westlands", "Workday", "https://www.accenture.com/ke-en/careers", "ke.careers@accenture.com", ["SAP", "Salesforce", "Azure", "ServiceNow"], 7, 1),
    ("Glovo Kenya", "Quick Commerce", "Westlands", "Greenhouse", "https://jobs.glovoapp.com", "nairobi.tech@glovoapp.com", ["Python", "Kotlin", "PostgreSQL", "Kafka"], 5, 1),
    ("ILRI", "Research/NGO", "Kabete", "Oracle Taleo", "https://www.ilri.org/careers", "ilri-hr@cgiar.org", ["R", "Python", "QGIS", "PostgreSQL"], 3, 2),
    ("JTL Fiber", "ISP/Telecom", "Industrial Area", "Internal", "https://jtl.co.ke/careers", "hr@jtl.co.ke", ["CCNP", "BGP", "Python", "Linux"], 4, 1),
    ("Oracle Kenya", "Enterprise Tech", "Westlands", "Oracle Taleo", "https://www.oracle.com/corporate/careers", "oracle.kenya@oracle.com", ["Oracle DB", "Java", "PL/SQL"], 4, 1),
    ("Cisco Kenya", "Networking", "Westlands", "Workday", "https://jobs.cisco.com", "africa.hiring@cisco.com", ["CCNP", "CCIE", "Python", "DevNet"], 3, 1),
    ("Interswitch EA", "FinTech", "Westlands", "Internal", "https://www.interswitchgroup.com/careers", "careers@interswitchgroup.com", ["Java", "Node.js", "React", "Oracle"], 4, 1),
    ("CloudFactory", "AI Data/BPO", "Westlands", "Greenhouse", "https://www.cloudfactory.com/careers", "hiring@cloudfactory.com", ["Python", "TensorFlow", "React", "PostgreSQL"], 5, 1),
    ("EY Kenya", "Consulting", "Upper Hill", "Workday", "https://www.ey.com/en_ke/careers", "kenya.careers@ey.com", ["SAP", "Oracle", "Tableau", "Python"], 5, 1),
    ("KPMG Kenya", "Consulting", "Upper Hill", "Workday", "https://www.kpmg.com/ke/en/home/careers.html", "careers@kpmg.co.ke", ["SAP", "Power BI", "Azure", "Python"], 4, 1),
    ("Kenya Power", "Utilities/Gov", "CBD", "Internal", "https://www.kenyapower.co.ke/careers", "hr@kplc.co.ke", ["SAP ERP", "Oracle", "GIS/SCADA", "Python"], 3, 1),
    ("ICT Authority", "Government", "Nairobi CBD", "Internal", "https://icta.go.ke/careers", "careers@icta.go.ke", ["Oracle", "Python", "Cybersecurity"], 2, 1),
    ("Roam Electric", "EV/Transport", "Ruaraka", "Internal", "https://roamelectric.com/careers", "careers@roamelectric.com", ["Embedded C", "Python", "IoT", "CAN Bus"], 3, 1),
    ("Burn Manufacturing", "CleanTech", "Ruaraka", "Lever", "https://www.burn.co/careers", "hr@burn.co", ["Python", "IoT", "React", "PostgreSQL"], 3, 1),
    ("AGRA", "NGO/AgriTech", "Westlands", "Taleo", "https://agra.org/careers", "hr@agra.org", ["DHIS2", "Kobo", "Python", "PowerBI"], 2, 2),
    ("I&M Bank", "Banking", "CBD", "Internal", "https://www.imbank.com/careers", "careers@imbank.com", ["Java", "Oracle", "Temenos", "SQL"], 3, 1),
    ("Co-operative Bank", "Banking", "CBD", "Internal", "https://www.co-opbank.co.ke/careers", "hr@co-opbank.co.ke", ["Java", "Oracle", "SQL Server", "T24"], 4, 1),
    ("Moringa School", "EdTech", "Kilimani", "Internal", "https://moringaschool.com/careers", "hr@moringaschool.com", ["React", "Python", "Node.js", "PostgreSQL"], 3, 1),
    ("Africa's Talking", "API/Telecom", "Westlands", "Internal", "https://africastalking.com/careers", "careers@africastalking.com", ["Python", "Java", "Node.js", "SMS API"], 4, 1),
    ("Pesapal", "FinTech", "Westlands", "Internal", "https://pesapal.com/careers", "hr@pesapal.com", ["PHP", "Laravel", "React", "MySQL"], 3, 1),
    ("mPharma Kenya", "HealthTech", "Westlands", "Lever", "https://mpharma.com/careers", "talent@mpharma.com", ["React", "Python", "PostgreSQL", "AWS"], 3, 1),
    ("Sendy", "Logistics Tech", "Nairobi", "Greenhouse", "https://sendy.co.ke/careers", "hr@sendy.co.ke", ["React Native", "Python", "Node.js", "MongoDB"], 3, 1),
    ("Umba", "FinTech", "Westlands", "Greenhouse", "https://www.umba.com/careers", "careers@umba.com", ["React Native", "Python", "Node.js", "PostgreSQL"], 3, 1),
    ("Kopo Kopo", "FinTech", "Westlands", "Internal", "https://kopokopo.co.ke/careers", "hr@kopokopo.co.ke", ["Ruby", "React", "PostgreSQL", "AWS"], 2, 1),
    ("Safaricom Spark", "Startup/VC", "Westlands", "Internal", "https://www.safaricomopco.com/spark", "spark@safaricom.co.ke", ["React", "Node.js", "Python", "AWS"], 3, 1),
    ("Britam", "Insurance", "Upper Hill", "Internal", "https://britam.com/careers", "careers@britam.com", ["Java", "Oracle", "SQL", "Azure"], 3, 1),
    ("Nation Media Group", "Media/Tech", "Upper Hill", "Internal", "https://www.nationmedia.com/careers", "hr@nation.co.ke", ["React", "Node.js", "AWS", "CMS"], 2, 1),
    ("Equity Afia", "HealthTech", "Upper Hill", "Internal", "https://equityafia.co.ke/careers", "hr@equityafia.co.ke", ["React", "Node.js", "PostgreSQL", "Python"], 2, 1),
    ("Abacus Consulting", "IT Consulting", "Westlands", "Internal", "https://abacusconsulting.co.ke/careers", "hr@abacusconsulting.co.ke", ["SAP", "Oracle", "Python", "PowerBI"], 3, 1),
    ("Kenya Airways IT", "Aviation/Tech", "Embakasi", "Internal", "https://www.kenya-airways.com/careers", "hr@kenya-airways.com", ["Java", "Oracle", "SAP", "Python"], 2, 1),
    ("Farmshine", "AgriTech", "Kilimani", "Internal", "https://farmshine.com/careers", "hr@farmshine.com", ["React", "Python", "PostgreSQL", "GIS"], 2, 1),
    ("ICEA Lion", "Insurance", "Westlands", "Internal", "https://www.icealion.com/careers", "hr@icealion.com", ["Java", "Oracle", "SQL", "Python"], 2, 1),
    ("CloudFactory Kenya", "AI Data/BPO", "Westlands", "Greenhouse", "https://www.cloudfactory.com/careers", "ke.hiring@cloudfactory.com", ["Python", "TensorFlow", "CVAT", "AWS"], 5, 1),

    # ── 40 newly added employers ──
    ("Branch International", "FinTech", "Nairobi", "Greenhouse", "https://branch.co/careers", "careers@branch.co", ["Python", "Kotlin", "Go", "AWS"], 4, 1),
    ("Tala", "FinTech", "Nairobi", "Greenhouse", "https://tala.co/careers", "careers@tala.co", ["Java", "Kotlin", "Python", "AWS"], 4, 1),
    ("Copia Global", "E-commerce", "Nairobi", "Lever", "https://copia.co.ke/careers", "hr@copia.co.ke", ["React", "Python", "PostgreSQL", "AWS"], 3, 1),
    ("SunCulture", "AgriTech/CleanTech", "Nairobi", "Internal", "https://sunculture.com/careers", "careers@sunculture.com", ["Python", "IoT", "React", "Embedded C"], 3, 1),
    ("Zola Electric", "CleanTech", "Nairobi", "Lever", "https://zolaelectric.com/careers", "careers@zolaelectric.com", ["Python", "IoT", "React", "AWS"], 3, 1),
    ("Poa Internet", "ISP", "Nairobi", "Internal", "https://poa.africa/careers", "hr@poa.africa", ["Linux", "Python", "Networking", "K8s"], 3, 1),
    ("Wananchi Group (Zuku)", "ISP/Media", "Nairobi", "Internal", "https://wananchi.com/careers", "hr@wananchi.com", ["Java", "Networking", "SQL", "Linux"], 2, 1),
    ("Liquid Intelligent Technologies", "Telecom/Data Centers", "Nairobi", "Internal", "https://liquid.tech/careers", "careers.ke@liquid.tech", ["Networking", "Cloud", "Python", "Linux"], 4, 1),
    ("iColo.io", "Data Centers", "Nairobi", "Internal", "https://icolo.io/careers", "careers@icolo.io", ["Networking", "Linux", "VMware", "Security"], 2, 1),
    ("Airtel Kenya", "Telecom", "Nairobi", "Internal", "https://africa.airtel.com/careers", "hr.ke@airtel.africa", ["Java", "Networking", "SQL", "5G"], 4, 1),
    ("Telkom Kenya", "Telecom", "Nairobi", "Internal", "https://telkom.co.ke/careers", "hr@telkom.co.ke", ["Networking", "Java", "Linux", "SQL"], 3, 1),
    ("Family Bank", "Banking", "Nairobi", "Internal", "https://familybank.co.ke/careers", "careers@familybank.co.ke", ["Java", "Oracle", "T24", "SQL"], 3, 1),
    ("Sidian Bank", "Banking", "Nairobi", "Internal", "https://sidianbank.co.ke/careers", "hr@sidianbank.co.ke", ["Java", "SQL", "Temenos"], 2, 1),
    ("Stanbic Bank Kenya", "Banking", "Nairobi", "SuccessFactors", "https://www.stanbicbank.co.ke/careers", "ke.careers@stanbic.com", ["Java", "Oracle", "React", "Azure"], 4, 1),
    ("HF Group", "Banking/Housing Finance", "Nairobi", "Internal", "https://hfgroup.co.ke/careers", "hr@hfgroup.co.ke", ["Java", "SQL", "Oracle"], 2, 1),
    ("Old Mutual Kenya", "Insurance/FinTech", "Nairobi", "Internal", "https://oldmutual.co.ke/careers", "careers@oldmutual.co.ke", ["Java", "SQL", "PowerBI"], 3, 1),
    ("Jubilee Insurance", "Insurance", "Nairobi", "Internal", "https://jubileeinsurance.com/careers", "hr@jubileeinsurance.com", ["Java", "Oracle", "SQL"], 2, 1),
    ("APA Insurance", "Insurance", "Nairobi", "Internal", "https://apainsurance.org/careers", "careers@apainsurance.org", ["Java", "SQL", "PowerBI"], 2, 1),
    ("CIC Insurance", "Insurance", "Nairobi", "Internal", "https://cic.co.ke/careers", "hr@cic.co.ke", ["Java", "SQL", "Oracle"], 2, 1),
    ("Turaco", "InsurTech", "Nairobi", "Lever", "https://turaco.insure/careers", "careers@turaco.insure", ["Python", "React", "PostgreSQL", "AWS"], 3, 1),
    ("Pula Advisors", "InsurTech", "Nairobi", "Lever", "https://pula-advisors.com/careers", "careers@pula-advisors.com", ["Python", "React", "GIS", "PostgreSQL"], 2, 1),
    ("Watu Credit", "Asset Finance/FinTech", "Nairobi", "Internal", "https://watucredit.com/careers", "hr@watucredit.com", ["Java", "React", "PostgreSQL", "AWS"], 3, 1),
    ("Tugende Kenya", "Asset Finance", "Nairobi", "Internal", "https://tugende.co.ke/careers", "careers@tugende.co.ke", ["Python", "React", "PostgreSQL"], 2, 1),
    ("Kyosk", "Retail Tech", "Nairobi", "Greenhouse", "https://kyosk.app/careers", "careers@kyosk.app", ["Python", "React", "Node.js", "AWS"], 4, 1),
    ("MarketForce", "Retail Tech", "Nairobi", "Greenhouse", "https://marketforce.com/careers", "careers@marketforce.com", ["React Native", "Python", "PostgreSQL", "AWS"], 3, 1),
    ("Sky.Garden", "E-commerce", "Nairobi", "Internal", "https://sky.garden/careers", "hr@sky.garden", ["PHP", "React", "MySQL"], 2, 1),
    ("Little Cab", "Mobility", "Nairobi", "Internal", "https://littlecab.co.ke/careers", "careers@littlecab.co.ke", ["Kotlin", "Python", "PostgreSQL", "AWS"], 2, 1),
    ("Uber Kenya", "Mobility/Tech", "Nairobi", "Greenhouse", "https://www.uber.com/careers", "africa.hiring@uber.com", ["Go", "Python", "React", "Kafka"], 3, 1),
    ("Eneza Education", "EdTech", "Nairobi", "Internal", "https://enezaeducation.com/careers", "careers@enezaeducation.com", ["Python", "React", "USSD", "PostgreSQL"], 2, 1),
    ("Zeraki", "EdTech", "Nairobi", "Internal", "https://zeraki.co/careers", "careers@zeraki.co", ["Python", "React", "PostgreSQL", "AWS"], 2, 1),
    ("Bridge International Academies", "EdTech", "Nairobi", "Internal", "https://www.bridgeinternationalacademies.com/careers", "careers@bridgeinternationalacademies.com", ["Android", "Python", "PostgreSQL"], 2, 1),
    ("Chipper Cash", "FinTech", "Nairobi", "Greenhouse", "https://chippercash.com/careers", "careers@chippercash.com", ["Go", "Kotlin", "Python", "AWS"], 4, 1),
    ("Xetova", "Data/AI", "Nairobi", "Internal", "https://xetova.com/careers", "careers@xetova.com", ["Python", "TensorFlow", "AWS", "SQL"], 2, 1),
    ("Africa Data Centres", "Data Centers", "Nairobi", "Internal", "https://africadatacentres.com/careers", "careers@africadatacentres.com", ["Networking", "Linux", "VMware", "Security"], 2, 1),
    ("Turing", "Remote Dev Talent", "Remote", "Internal", "https://turing.com/careers", "talent@turing.com", ["React", "Python", "Node.js", "AWS"], 6, 1),
    ("Gebeya", "Tech Talent", "Remote", "Internal", "https://gebeya.com/careers", "talent@gebeya.com", ["React", "Python", "Java", "AWS"], 4, 1),
    ("GitLab", "DevTools (Remote-first)", "Remote", "Greenhouse", "https://about.gitlab.com/jobs", "recruiting@gitlab.com", ["Go", "Ruby", "Kubernetes", "PostgreSQL"], 3, 1),
    ("Canonical", "Open Source/Cloud (Remote-first)", "Remote", "Greenhouse", "https://canonical.com/careers", "careers@canonical.com", ["Python", "Go", "Linux", "K8s"], 3, 1),
    ("Toptal", "Freelance Talent Network", "Remote", "Internal", "https://toptal.com/careers", "careers@toptal.com", ["React", "Node.js", "Python", "AWS"], 3, 1),
    ("Tunga", "Dev Outsourcing", "Remote", "Internal", "https://tunga.io/careers", "talent@tunga.io", ["React", "Python", "Node.js", "PostgreSQL"], 3, 1),

    # ── 30 more newly added employers (batch 3) ──
    ("M-Changa", "FinTech/Crowdfunding", "Nairobi", "Internal", "https://mchanga.africa/careers", "careers@mchanga.africa", ["PHP", "React", "MySQL"], 2, 1),
    ("Ilara Health", "HealthTech", "Nairobi", "Lever", "https://ilarahealth.com/careers", "careers@ilarahealth.com", ["Python", "React", "PostgreSQL", "IoT"], 3, 1),
    ("Flare", "Emergency Response Tech", "Nairobi", "Internal", "https://flare.co/careers", "careers@flare.co", ["Python", "React Native", "GIS", "AWS"], 2, 1),
    ("iHub", "Tech Innovation Hub", "Nairobi", "Internal", "https://ihub.co.ke/careers", "info@ihub.co.ke", ["Python", "React", "Community Tech"], 2, 1),
    ("Nailab", "Startup Accelerator", "Nairobi", "Internal", "https://nailab.co.ke/careers", "info@nailab.co.ke", ["Python", "React", "Product Strategy"], 1, 1),
    ("4G Capital", "FinTech Lending", "Nairobi", "Internal", "https://4g-capital.com/careers", "careers@4g-capital.com", ["Java", "React", "PostgreSQL", "Credit scoring"], 2, 1),
    ("Asilimia", "FinTech", "Nairobi", "Internal", "https://asilimia.co.ke/careers", "careers@asilimia.co.ke", ["Python", "React Native", "PostgreSQL"], 2, 1),
    ("Fingo Africa", "Digital Banking", "Nairobi", "Internal", "https://fingo.africa/careers", "careers@fingo.africa", ["Kotlin", "React Native", "AWS"], 2, 1),
    ("LipaLater", "BNPL FinTech", "Nairobi", "Greenhouse", "https://lipalater.com/careers", "careers@lipalater.com", ["Python", "React", "PostgreSQL", "AWS"], 3, 1),
    ("SasaPay", "Mobile Payments", "Nairobi", "Internal", "https://sasapay.app/careers", "careers@sasapay.app", ["Java", "Python", "React", "AWS"], 2, 1),
    ("Kwara", "Banking Software (SACCOs)", "Nairobi", "Greenhouse", "https://kwara.com/careers", "careers@kwara.com", ["TypeScript", "React", "Node.js", "PostgreSQL"], 3, 1),
    ("M-Farm", "AgriTech", "Nairobi", "Internal", "https://mfarm.co.ke/careers", "careers@mfarm.co.ke", ["Python", "React", "USSD"], 2, 1),
    ("iProcure", "Agri Supply Chain Tech", "Nairobi", "Lever", "https://iprocure.com/careers", "careers@iprocure.com", ["Python", "React", "PostgreSQL", "Logistics"], 2, 1),
    ("Amitruck", "Logistics Tech", "Nairobi", "Internal", "https://amitruck.com/careers", "careers@amitruck.com", ["React Native", "Python", "GIS", "AWS"], 2, 1),
    ("Ajua", "Customer Experience Tech", "Nairobi", "Internal", "https://ajua.com/careers", "careers@ajua.com", ["Python", "React", "NLP", "AWS"], 3, 1),
    ("Huduma Kenya", "E-Government", "Nairobi", "Internal", "https://huduma.go.ke/careers", "info@huduma.go.ke", ["Oracle", "Java", "SQL"], 2, 1),
    ("Konza Technopolis", "Gov Tech City Authority", "Konza", "Internal", "https://konza.go.ke/careers", "info@konza.go.ke", ["Networking", "Python", "GIS", "Smart City"], 2, 1),
    ("Amref Health Africa", "Health NGO/Tech", "Nairobi", "Internal", "https://amref.org/careers", "careers@amref.org", ["PowerBI", "Python", "DHIS2"], 2, 2),
    ("Living Goods", "Health NGO/Tech", "Nairobi", "Internal", "https://livinggoods.org/careers", "careers@livinggoods.org", ["Android", "Python", "PostgreSQL"], 2, 2),
    ("BRCK", "Connectivity Hardware", "Nairobi", "Internal", "https://brck.com/careers", "careers@brck.com", ["Embedded C", "Python", "IoT", "Linux"], 2, 1),
    ("Ushahidi", "Civic Tech", "Nairobi", "Internal", "https://ushahidi.com/careers", "careers@ushahidi.com", ["PHP", "React", "PostgreSQL"], 1, 1),
    ("Kenya Revenue Authority", "Government/Tax Tech", "Nairobi", "Internal", "https://kra.go.ke/careers", "careers@kra.go.ke", ["Oracle", "Java", "SQL", "Cybersecurity"], 3, 1),
    ("National Bank of Kenya", "Banking", "Nairobi", "Internal", "https://nationalbank.co.ke/careers", "careers@nationalbank.co.ke", ["Java", "Oracle", "SQL"], 2, 1),
    ("Victoria Commercial Bank", "Banking", "Nairobi", "Internal", "https://victoriabank.co.ke/careers", "hr@victoriabank.co.ke", ["Java", "SQL", "Temenos"], 1, 1),
    ("Gulf African Bank", "Banking", "Nairobi", "Internal", "https://gulfafricanbank.com/careers", "careers@gulfafricanbank.com", ["Java", "Oracle", "SQL"], 2, 1),
    ("Diamond Trust Bank", "Banking", "Nairobi", "Internal", "https://dtbafrica.com/careers", "careers@dtbafrica.com", ["Java", "Oracle", "T24", "SQL"], 2, 1),
    ("Prime Bank Kenya", "Banking", "Nairobi", "Internal", "https://primebank.co.ke/careers", "careers@primebank.co.ke", ["Java", "SQL", "Oracle"], 1, 1),
    ("Bank of Africa Kenya", "Banking", "Nairobi", "Internal", "https://boakenya.com/careers", "careers@boakenya.com", ["Java", "SQL", "Temenos"], 2, 1),
    ("Faulu Microfinance Bank", "Banking", "Nairobi", "Internal", "https://faulukenya.com/careers", "careers@faulukenya.com", ["Java", "SQL", "Oracle"], 2, 1),
    ("Kenya National Bureau of Statistics", "Government/Data", "Nairobi", "Internal", "https://knbs.or.ke/careers", "info@knbs.or.ke", ["R", "Python", "SQL", "PowerBI"], 2, 1),

    # ── 12 newly added Kenyan Tech Employers (batch 4) ──
    ("Workpay Kenya", "FinTech/HRTech", "Nairobi", "Greenhouse", "https://myworkpay.com/careers", "careers@myworkpay.com", ["Python", "FastAPI", "React", "PostgreSQL", "AWS"], 5, 1),
    ("Shortlist Kenya", "Tech Talent Search", "Nairobi", "Lever", "https://www.shortlist.net/careers", "kenya@shortlist.net", ["Python", "React", "Data Analysis"], 4, 1),
    ("Pezesha", "FinTech/Lending", "Nairobi", "Internal", "https://pezesha.com/careers", "careers@pezesha.com", ["Python", "Django", "PostgreSQL", "Machine Learning"], 4, 1),
    ("Zanifu", "FinTech", "Nairobi", "Internal", "https://zanifu.com/careers", "careers@zanifu.com", ["React", "Python", "PostgreSQL", "AWS"], 3, 1),
    ("MyDawa", "HealthTech", "Nairobi", "Internal", "https://mydawa.com/careers", "careers@mydawa.com", ["React Native", "TypeScript", "Node.js", "PostgreSQL"], 3, 1),
    ("SunKing Kenya", "Solar Tech/IoT", "Nairobi", "Greenhouse", "https://sunking.com/careers", "careers.kenya@sunking.com", ["Python", "dbt", "BigQuery", "IoT", "AWS"], 5, 1),
    ("PigiaMe Kenya Tech", "Digital Media/Tech", "Nairobi", "Internal", "https://www.pigiame.co.ke/careers", "careers@pigiame.co.ke", ["PHP", "React", "MySQL", "Elasticsearch"], 3, 1),
    ("Access Afya", "HealthTech", "Nairobi", "Internal", "https://accessafya.com/careers", "careers@accessafya.com", ["Python", "React", "PostgreSQL"], 2, 1),
    ("Sendy Tech", "Logistics Tech", "Nairobi", "Greenhouse", "https://sendyit.com/careers", "careers@sendyit.com", ["Python", "Go", "React Native", "PostgreSQL"], 4, 1),
    ("Greenlight Planet", "Solar Energy Tech", "Nairobi", "Lever", "https://greenlightplanet.com/careers", "hr.kenya@greenlightplanet.com", ["Python", "React", "IoT", "AWS"], 3, 1),
    ("Roam Electric Tech", "CleanTech/EV", "Nairobi", "Internal", "https://roamelectric.com/careers", "engineering@roamelectric.com", ["Embedded C", "C++", "Python", "Linux", "IoT"], 4, 1),
    ("Samsora Mobility", "Mobility Tech", "Nairobi", "Internal", "https://samsoramobility.com/careers", "careers@samsoramobility.com", ["Kotlin", "Node.js", "PostgreSQL"], 2, 1),
]


async def seed() -> None:
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db_name]

    docs = [
        {
            "name": name,
            "sector": sector,
            "location": location,
            "ats_platform": ats,
            "career_url": url,
            "contact_email": email,
            "tech_stack": stack,
            "open_roles_count": open_roles,
            "tier": tier,
            "verification": {"status": "verified"},
        }
        for name, sector, location, ats, url, email, stack, open_roles, tier in COMPANIES
    ]

    from app.repositories.company_repository import CompanyRepository

    repo = CompanyRepository(db)
    written = await repo.bulk_upsert_by_name(docs)
    print(f"Seeded/updated {written} of {len(docs)} companies.")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
