// ──────────────────────────────────────────────────────────────────────────────
// IT Technician | Networking | All Support – Knowledge Base & Interview Prep
// ──────────────────────────────────────────────────────────────────────────────

export interface ITKnowledgeItem {
  id: number;
  category: string;
  subcategory: string;
  question: string;
  answer: string;
  codeSnippet?: string; // CLI commands, config snippets, etc.
  jobTypes: ("IT Support" | "Networking" | "Sysadmin" | "Security" | "Cloud" | "General IT")[];
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  tags: string[];
}

export interface ITCategoryGroup {
  id: string;
  title: string;
  icon: string;
  count: number;
  description: string;
}

export const IT_CATEGORY_GROUPS: ITCategoryGroup[] = [
  { id: "helpdesk",    title: "1. Help Desk & Desktop Support",    icon: "monitor", count: 20, description: "Ticketing, troubleshooting workflows, OS issues, hardware support, and end-user management." },
  { id: "networking",  title: "2. Networking Fundamentals",        icon: "globe", count: 25, description: "TCP/IP, DNS, DHCP, VLANs, subnetting, routing protocols, and wireless networking." },
  { id: "windows",     title: "3. Windows Server & AD",            icon: "server", count: 15, description: "Active Directory, Group Policy, DNS/DHCP roles, user management, and domain operations." },
  { id: "hardware",    title: "4. Hardware & Infrastructure",      icon: "wrench", count: 10, description: "Server hardware, RAID, storage, power, UPS, and rack management." },
  { id: "security",    title: "5. IT Security & Compliance",       icon: "lock", count: 15, description: "Endpoint security, firewalls, VPN, MFA, patch management, and compliance standards." },
  { id: "cloud",       title: "6. Cloud & Virtualisation",         icon: "cloud", count: 10, description: "AWS, Azure, VMware, Hyper-V, backup, and disaster recovery." },
  { id: "certs",       title: "7. Certifications & Study Guide",   icon: "award", count: 10, description: "CompTIA A+, Network+, Security+, CCNA key topics and exam tips." },
  { id: "scenarios",   title: "8. Real-World Support Scenarios",   icon: "target", count: 15, description: "Common escalation paths, tricky troubleshooting scenarios, and interview situations." },
];

export const IT_KNOWLEDGE_BASE: ITKnowledgeItem[] = [

  // ═══════════════════════════════════════════════════════════════
  // 1. HELP DESK & DESKTOP SUPPORT (1 – 20)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 1,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Troubleshooting",
    question: "What is the standard troubleshooting methodology for IT support?",
    answer: `Follow the CompTIA A+ 6-step model:
1. Identify the problem (gather information, duplicate the issue)
2. Establish a theory of probable cause
3. Test the theory to determine cause
4. Establish a plan of action and implement the fix
5. Verify full system functionality & implement preventive measures
6. Document findings, actions, and outcomes`,
    jobTypes: ["IT Support", "General IT"],
    difficulty: "Beginner",
    tags: ["troubleshooting", "methodology", "CompTIA A+", "help desk"]
  },
  {
    id: 2,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Ticketing",
    question: "What is an ITIL-based ticketing workflow?",
    answer: `ITIL (IT Infrastructure Library) ticket lifecycle:
• Incident created → categorised → prioritised (P1 Critical → P4 Low)
• Assigned to correct tier (L1 → L2 → L3)
• Investigation & diagnosis
• Resolution & recovery
• Closure & customer confirmation
• Knowledge article updated

SLA targets are tracked per priority (e.g. P1 = 1-hour response, 4-hour resolution).`,
    jobTypes: ["IT Support"],
    difficulty: "Beginner",
    tags: ["ITIL", "ticketing", "SLA", "ServiceNow", "Jira"]
  },
  {
    id: 3,
    category: "1. Help Desk & Desktop Support",
    subcategory: "OS Issues",
    question: "How do you fix a Windows PC that won't boot (blue screen / no POST)?",
    answer: `Diagnosis path:
• No POST: Check power, reseat RAM, clear CMOS, test PSU
• POST OK but no OS: Boot from USB → run startup repair or chkdsk /f /r
• Blue Screen (BSOD): Note stop code → check Event Viewer → update/roll back drivers
• Safe Mode: F8 / Shift+Restart → Troubleshoot → Advanced → Startup Settings

Key commands:
  sfc /scannow        — System File Checker
  DISM /Online /Cleanup-Image /RestoreHealth  — fix Windows image
  chkdsk C: /f /r     — check disk for errors`,
    codeSnippet: `# Run in elevated CMD / PowerShell
sfc /scannow
DISM /Online /Cleanup-Image /RestoreHealth
chkdsk C: /f /r /x`,
    jobTypes: ["IT Support", "General IT"],
    difficulty: "Intermediate",
    tags: ["Windows", "BSOD", "boot", "troubleshooting", "chkdsk", "sfc"]
  },
  {
    id: 4,
    category: "1. Help Desk & Desktop Support",
    subcategory: "OS Issues",
    question: "How do you reset a forgotten local administrator password on Windows?",
    answer: `Method 1 – Windows Installation Media (offline):
1. Boot from USB → Repair your computer → Command Prompt
2. Rename Utilman.exe to Utilman.bak; copy cmd.exe to Utilman.exe
3. Reboot → At login screen click Ease of Access → CMD opens as SYSTEM
4. net user Administrator NewPassword123

Method 2 – Domain-joined PC: Reset via Active Directory Users and Computers (ADUC) → right-click user → Reset Password.

Method 3 – Microsoft account: Use account.live.com reset flow.`,
    codeSnippet: `# Offline reset via recovery CMD
net user Administrator P@ssw0rd123!
# Re-enable if disabled
net user Administrator /active:yes`,
    jobTypes: ["IT Support"],
    difficulty: "Intermediate",
    tags: ["Windows", "password reset", "administrator", "security"]
  },
  {
    id: 5,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Connectivity",
    question: "A user says 'I have no internet.' What is your troubleshooting process?",
    answer: `Layered approach (OSI model bottom-up):
1. Physical: Check cable / Wi-Fi signal, NIC lights
2. ipconfig /all → confirm IP (169.x.x.x = DHCP failure, 0.0.0.0 = no IP)
3. ping 127.0.0.1 → loopback (NIC works)
4. ping default gateway → LAN reachability
5. ping 8.8.8.8 → internet IP reachability (if fails = routing issue)
6. nslookup google.com → DNS resolution
7. Check proxy / firewall settings, flush DNS

Common fixes: ipconfig /release && ipconfig /renew, netsh winsock reset`,
    codeSnippet: `ipconfig /all
ping 127.0.0.1
ping 192.168.1.1       # gateway
ping 8.8.8.8           # Google DNS (tests routing)
nslookup google.com
ipconfig /flushdns
netsh winsock reset`,
    jobTypes: ["IT Support", "Networking"],
    difficulty: "Beginner",
    tags: ["connectivity", "ping", "DNS", "DHCP", "troubleshooting"]
  },
  {
    id: 6,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Remote Support",
    question: "What remote support tools do IT technicians commonly use?",
    answer: `• Microsoft Quick Assist / Remote Desktop (RDP) – built-in Windows
• TeamViewer – cross-platform, external support
• AnyDesk – lightweight, fast connections
• BeyondTrust Remote Support – enterprise-grade
• Zoho Assist, Splashtop – cloud-based options
• LogMeIn Rescue – Tier 1-3 enterprise tool
• SCCM Remote Control / Intune – managed device remote access
• SSH (Linux/network devices), PuTTY

Best practices: Always get user consent, log session, follow least-privilege.`,
    jobTypes: ["IT Support"],
    difficulty: "Beginner",
    tags: ["remote support", "RDP", "TeamViewer", "AnyDesk", "SCCM"]
  },
  {
    id: 7,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Email",
    question: "How do you troubleshoot Outlook not connecting to Exchange/Microsoft 365?",
    answer: `Steps:
1. Check internet connectivity
2. Verify account credentials (Control Panel → Mail → Account Settings)
3. Run Microsoft Support and Recovery Assistant (SaRA tool)
4. Check Autodiscover DNS record: nslookup autodiscover.domain.com
5. Verify license assigned in Microsoft 365 admin centre
6. Create new Outlook profile (Control Panel → Mail → Show Profiles)
7. Check shared mailbox permissions if shared mailbox issue
8. Test in OWA (outlook.office.com) – isolates client vs server issue`,
    codeSnippet: `# Test Autodiscover
nslookup autodiscover.contoso.com

# PowerShell – check user mailbox
Get-Mailbox -Identity user@domain.com | fl DisplayName,PrimarySmtpAddress`,
    jobTypes: ["IT Support"],
    difficulty: "Intermediate",
    tags: ["Outlook", "Exchange", "Microsoft 365", "email", "Autodiscover"]
  },
  {
    id: 8,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Printers",
    question: "How do you troubleshoot a network printer that won't print?",
    answer: `1. Check physical: power, paper, toner, cables / Wi-Fi
2. Confirm printer IP is reachable: ping <printer_IP>
3. Access printer web UI (http://<IP>) to check status
4. On workstation: clear print queue (services.msc → Print Spooler → Restart)
5. Remove and re-add printer using correct IP/driver
6. Check firewall (ports 9100 raw, 515 LPD, 631 IPP)
7. Driver mismatch: download vendor driver, not generic
8. Group Policy may force a specific server-side printer – check GPO`,
    codeSnippet: `# Restart print spooler (elevated CMD)
net stop spooler
del /Q /F /S "%systemroot%\\System32\\spool\\PRINTERS\\*.*"
net start spooler`,
    jobTypes: ["IT Support"],
    difficulty: "Beginner",
    tags: ["printer", "print spooler", "network printer", "troubleshooting"]
  },
  {
    id: 9,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Asset Management",
    question: "What is IT asset management and why is it important?",
    answer: `IT Asset Management (ITAM) tracks hardware and software assets throughout their lifecycle: Procurement → Deployment → Maintenance → Retirement.

Key benefits:
• Accurate inventory prevents over/under-licensing (cost savings)
• Enables faster troubleshooting (know hardware specs, warranty status)
• Software license compliance (avoid audit fines)
• Supports security patching (know what's in the environment)

Common tools: Microsoft SCCM / Intune, Lansweeper, Snipe-IT (open-source), ServiceNow ITAM, Ivanti.`,
    jobTypes: ["IT Support", "Sysadmin"],
    difficulty: "Beginner",
    tags: ["asset management", "ITAM", "SCCM", "inventory", "licensing"]
  },
  {
    id: 10,
    category: "1. Help Desk & Desktop Support",
    subcategory: "OS Deployment",
    question: "What is OS imaging and how do you deploy Windows at scale?",
    answer: `OS Imaging = capturing a configured Windows installation (a .wim file) and deploying it to multiple PCs.

Methods:
• MDT (Microsoft Deployment Toolkit) – free, task-sequence based, PXE boot
• SCCM / Intune OSD – enterprise imaging + app deployment
• Windows Autopilot – cloud-first zero-touch provisioning with Intune
• Clonezilla – open-source disk cloning

Process: Reference machine → Sysprep (generalize) → Capture WIM → Deploy via PXE/USB.`,
    codeSnippet: `# Sysprep before capture
C:\\Windows\\System32\\Sysprep\\sysprep.exe /generalize /oobe /shutdown`,
    jobTypes: ["IT Support", "Sysadmin"],
    difficulty: "Intermediate",
    tags: ["imaging", "MDT", "SCCM", "Autopilot", "Sysprep", "deployment"]
  },
  {
    id: 11,
    category: "1. Help Desk & Desktop Support",
    subcategory: "User Management",
    question: "How do you create, disable, and unlock user accounts in Active Directory?",
    answer: `Via GUI (ADUC):
• ADUC → find user → right-click → New/Reset Password/Disable/Enable/Unlock

Via PowerShell (preferred for scale):`,
    codeSnippet: `# Create user
New-ADUser -Name "John Doe" -GivenName John -Surname Doe \`
  -SamAccountName jdoe -UserPrincipalName jdoe@domain.com \`
  -AccountPassword (ConvertTo-SecureString "P@ss!" -AsPlainText -Force) \`
  -Enabled $true -Path "OU=Staff,DC=domain,DC=com"

# Disable account
Disable-ADAccount -Identity jdoe

# Unlock account
Unlock-ADAccount -Identity jdoe

# Reset password
Set-ADAccountPassword jdoe -Reset -NewPassword (ConvertTo-SecureString "NewP@ss!" -AsPlainText -Force)`,
    jobTypes: ["IT Support", "Sysadmin"],
    difficulty: "Intermediate",
    tags: ["Active Directory", "PowerShell", "user management", "ADUC"]
  },
  {
    id: 12,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Performance",
    question: "How do you diagnose a slow computer?",
    answer: `Systematic performance check:
1. Task Manager (Ctrl+Shift+Esc): CPU, RAM, Disk, Network usage
2. Resource Monitor: detailed per-process disk/network I/O
3. Check disk health: CrystalDiskInfo (SMART data)
4. Run disk cleanup + defrag (HDD) or TRIM (SSD)
5. Disable startup programs: Task Manager → Startup tab
6. Check for malware: Windows Defender / Malwarebytes scan
7. Check Event Viewer for hardware errors
8. RAM: run Windows Memory Diagnostic (mdsched.exe)
9. Overheat: HWMonitor → check CPU/GPU temps`,
    jobTypes: ["IT Support"],
    difficulty: "Beginner",
    tags: ["performance", "slow PC", "Task Manager", "RAM", "troubleshooting"]
  },
  {
    id: 13,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Security",
    question: "A user reports a possible ransomware infection. What do you do?",
    answer: `Incident response steps:
1. ISOLATE immediately – disconnect from network (pull cable / disable Wi-Fi)
2. DO NOT restart or pay the ransom
3. Notify security team / manager (escalate to Tier 2/3)
4. Preserve evidence: photograph screen, note ransom note details
5. Identify patient zero: when did infection start? What was opened?
6. Check backup status – most recent clean backup
7. Rebuild or restore from backup after forensic review
8. Report to management, document root cause
9. User awareness training post-incident`,
    jobTypes: ["IT Support", "Security"],
    difficulty: "Advanced",
    tags: ["ransomware", "incident response", "security", "malware"]
  },
  {
    id: 14,
    category: "1. Help Desk & Desktop Support",
    subcategory: "VPN",
    question: "How do you troubleshoot a VPN that won't connect?",
    answer: `Common VPN issues and fixes:
1. Credentials: confirm username, password, MFA token
2. Internet connectivity: must have base internet before VPN
3. Client version: update VPN client (Cisco AnyConnect, GlobalProtect, etc.)
4. Firewall/port blocking: VPN uses UDP 500/4500 (IKEv2), TCP 443 (SSL VPN)
5. Split tunnel vs full tunnel: confirm routing config
6. Certificate issues: expired cert on client or server
7. DNS after VPN: nslookup internal.company.com – must resolve via VPN DNS
8. Logs: check VPN client logs for error codes`,
    jobTypes: ["IT Support", "Networking"],
    difficulty: "Intermediate",
    tags: ["VPN", "AnyConnect", "GlobalProtect", "troubleshooting", "firewall"]
  },
  {
    id: 15,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Mobile Devices",
    question: "What is MDM and how is it used to manage corporate mobile devices?",
    answer: `MDM (Mobile Device Management) centrally manages smartphones, tablets, and laptops.

Key features:
• Enroll devices (corporate-owned or BYOD)
• Enforce policies: screen lock, encryption, password complexity
• Remote wipe if device is lost/stolen
• App distribution (push/block apps)
• Compliance checking (jailbreak detection)
• Certificate deployment for Wi-Fi/VPN

Common platforms: Microsoft Intune, Jamf (macOS/iOS), VMware Workspace ONE, Google Endpoint Management.`,
    jobTypes: ["IT Support", "Sysadmin"],
    difficulty: "Intermediate",
    tags: ["MDM", "Intune", "Jamf", "mobile", "BYOD", "device management"]
  },
  {
    id: 16,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Backup",
    question: "What is the 3-2-1 backup rule?",
    answer: `3-2-1 Rule (industry best practice):
• 3 copies of data (1 production + 2 backups)
• 2 different storage media types (e.g. local disk + NAS)
• 1 offsite/cloud copy (protects against site disaster, ransomware)

Modern extension: 3-2-1-1-0
• Additional 1 offline/air-gapped copy
• 0 backup errors after verification

Tools: Veeam Backup, Windows Server Backup, Acronis, Backblaze, Azure Backup.`,
    jobTypes: ["IT Support", "Sysadmin"],
    difficulty: "Beginner",
    tags: ["backup", "3-2-1", "disaster recovery", "Veeam", "data protection"]
  },
  {
    id: 17,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Communication",
    question: "How do you manage a frustrated end-user during a support call?",
    answer: `CARP framework for difficult users:
• Control your own reaction (stay calm, professional tone)
• Acknowledge the problem ("I understand this is affecting your work")
• Refocus on solving ("Let me walk you through a fix right now")
• Problem-solve methodically

Tips:
- Never blame the user or previous technician
- Use simple non-technical language
- Provide realistic ETAs; update proactively
- Escalate if needed rather than over-promise
- Document all communication in the ticket`,
    jobTypes: ["IT Support", "General IT"],
    difficulty: "Beginner",
    tags: ["communication", "customer service", "soft skills", "escalation"]
  },
  {
    id: 18,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Patch Management",
    question: "What is patch management and what tools are used?",
    answer: `Patch management is the systematic process of acquiring, testing, and deploying software updates to fix vulnerabilities and bugs.

Lifecycle:
1. Identify missing patches (vulnerability scanning)
2. Evaluate and prioritise (CVSS score, exploitability)
3. Test in non-production environment
4. Deploy via maintenance window
5. Verify and document

Tools:
• WSUS (Windows Server Update Services) – on-prem Microsoft
• SCCM / Intune – enterprise managed patching
• Qualys / Tenable Nessus – vulnerability + patch scanning
• Lansweeper, NinjaRMM – MSP patch management`,
    jobTypes: ["IT Support", "Sysadmin", "Security"],
    difficulty: "Intermediate",
    tags: ["patch management", "WSUS", "SCCM", "vulnerabilities", "updates"]
  },
  {
    id: 19,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Documentation",
    question: "Why is documentation important in IT support and what should be documented?",
    answer: `Good documentation enables:
• Faster resolution (known issues don't need re-investigation)
• Knowledge transfer between techs
• Audit trail and compliance evidence
• Training new staff

What to document:
• All ticket actions and timestamps
• Network diagrams and IP schemas
• Standard Operating Procedures (SOPs)
• Known error / workaround articles
• Asset register and warranty dates
• Change logs and configuration baselines`,
    jobTypes: ["IT Support", "General IT"],
    difficulty: "Beginner",
    tags: ["documentation", "knowledge base", "SOP", "ITIL"]
  },
  {
    id: 20,
    category: "1. Help Desk & Desktop Support",
    subcategory: "Escalation",
    question: "When should a Tier 1 technician escalate a ticket?",
    answer: `Escalate when:
• Issue is beyond Tier 1 technical scope (server, network, security)
• SLA breach risk (time limit approaching with no resolution)
• Issue affects multiple users (potential outage)
• Security incident suspected (malware, breach, data loss)
• Requires elevated permissions you don't have
• Vendor/specialist engagement needed
• User is a VIP / executive (immediate priority)

Before escalating:
- Document all steps taken
- Include error messages, screenshots
- Set correct priority level
- Brief the Tier 2 technician verbally if urgent`,
    jobTypes: ["IT Support"],
    difficulty: "Beginner",
    tags: ["escalation", "Tier 1", "SLA", "ITIL", "ticketing"]
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. NETWORKING FUNDAMENTALS (21 – 45)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 21,
    category: "2. Networking Fundamentals",
    subcategory: "OSI Model",
    question: "Explain the 7 layers of the OSI model with examples.",
    answer: `7 Layers (mnemonic: Please Do Not Throw Sausage Pizza Away):
1. Physical – cables, hubs, bits (RJ45, fiber, Wi-Fi radio)
2. Data Link – MAC addresses, switches, frames (Ethernet, VLAN)
3. Network – IP addresses, routing, packets (IP, ICMP, ARP)
4. Transport – end-to-end communication, ports (TCP, UDP)
5. Session – session establishment/teardown (NetBIOS, RPC)
6. Presentation – encryption, encoding (SSL/TLS, JPEG, ASCII)
7. Application – user-facing protocols (HTTP, DNS, FTP, SMTP)

Common exam trap: switches operate at Layer 2; routers at Layer 3; firewalls often Layer 3-7.`,
    jobTypes: ["Networking", "General IT"],
    difficulty: "Beginner",
    tags: ["OSI", "networking", "TCP/IP", "layers", "CompTIA"]
  },
  {
    id: 22,
    category: "2. Networking Fundamentals",
    subcategory: "TCP/IP",
    question: "What is the difference between TCP and UDP?",
    answer: `TCP (Transmission Control Protocol):
• Connection-oriented (3-way handshake: SYN → SYN-ACK → ACK)
• Reliable delivery with acknowledgements and retransmission
• Flow control and congestion control
• Ordered delivery
• Used by: HTTP/HTTPS, FTP, SMTP, SSH

UDP (User Datagram Protocol):
• Connectionless – no handshake
• Unreliable: no acknowledgements or retransmission
• Lower latency, less overhead
• Used by: DNS, DHCP, VoIP, video streaming, gaming`,
    jobTypes: ["Networking", "General IT"],
    difficulty: "Beginner",
    tags: ["TCP", "UDP", "transport layer", "protocol"]
  },
  {
    id: 23,
    category: "2. Networking Fundamentals",
    subcategory: "IP Addressing",
    question: "How does IPv4 subnetting work? Explain CIDR notation.",
    answer: `IPv4 = 32-bit address (e.g. 192.168.1.100). Divided into Network + Host portions by a subnet mask.

CIDR Notation: 192.168.1.0/24
• /24 means 24 bits for network → 8 bits for hosts → 2^8 - 2 = 254 usable hosts

Common subnets:
/8   = 255.0.0.0       → 16M hosts (Class A)
/16  = 255.255.0.0     → 65,534 hosts (Class B)
/24  = 255.255.255.0   → 254 hosts (Class C)
/28  = 255.255.255.240 → 14 hosts
/30  = 255.255.255.252 → 2 hosts (point-to-point links)

Private ranges (RFC 1918):
10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16`,
    jobTypes: ["Networking"],
    difficulty: "Intermediate",
    tags: ["subnetting", "CIDR", "IPv4", "IP addressing", "CCNA"]
  },
  {
    id: 24,
    category: "2. Networking Fundamentals",
    subcategory: "DNS",
    question: "How does DNS resolution work step by step?",
    answer: `DNS Resolution (recursive query):
1. User types google.com → browser checks local cache
2. Query sent to OS resolver (checks hosts file + local cache)
3. Query sent to Recursive Resolver (ISP or 8.8.8.8)
4. Recursive Resolver queries Root Name Server (.) → returns TLD server
5. TLD Name Server (.com) returns Authoritative NS for google.com
6. Authoritative Name Server returns A record (IP address)
7. Recursive Resolver caches result (TTL) and returns to client

Record types:
• A → IPv4 address
• AAAA → IPv6 address
• MX → mail server
• CNAME → alias
• PTR → reverse DNS
• TXT → SPF, DKIM, verification`,
    codeSnippet: `# Test DNS resolution
nslookup google.com 8.8.8.8
dig google.com @8.8.8.8
# Check MX records
nslookup -type=MX domain.com`,
    jobTypes: ["Networking", "Sysadmin"],
    difficulty: "Intermediate",
    tags: ["DNS", "resolution", "records", "nslookup", "dig"]
  },
  {
    id: 25,
    category: "2. Networking Fundamentals",
    subcategory: "DHCP",
    question: "Explain the DHCP DORA process.",
    answer: `DORA = the 4-step DHCP handshake:
1. Discover – Client broadcasts "I need an IP" (source: 0.0.0.0, dest: 255.255.255.255)
2. Offer – DHCP server responds with an available IP lease offer
3. Request – Client broadcasts "I want that IP" (confirms to server)
4. Acknowledge – Server confirms lease with IP, subnet, gateway, DNS, lease time

Lease renewal happens at 50% of lease time (unicast to server).

Troubleshoot: 169.254.x.x = APIPA (client got no DHCP response → check server, scope exhaustion, relay agent).`,
    jobTypes: ["Networking", "IT Support"],
    difficulty: "Beginner",
    tags: ["DHCP", "DORA", "IP addressing", "lease", "networking"]
  },
  {
    id: 26,
    category: "2. Networking Fundamentals",
    subcategory: "VLANs",
    question: "What is a VLAN and why is it used?",
    answer: `VLAN (Virtual LAN) logically segments a physical switch into multiple broadcast domains.

Benefits:
• Security: isolate traffic (e.g. Finance VLAN can't reach Guest VLAN)
• Performance: reduces broadcast traffic per segment
• Flexibility: group users logically regardless of physical location
• Compliance: PCI-DSS requires card data environment isolation

Key concepts:
• Access port: carries one VLAN (end devices)
• Trunk port: carries multiple VLANs (switch-to-switch, switch-to-router)
• 802.1Q tagging: 4-byte tag in Ethernet frame identifies VLAN
• Native VLAN: untagged VLAN on trunk (default VLAN 1 – change for security)
• Inter-VLAN routing: Router-on-a-Stick or Layer 3 switch (SVIs)`,
    codeSnippet: `! Cisco IOS – Create VLAN, assign access port
vlan 10
 name FINANCE
interface FastEthernet0/1
 switchport mode access
 switchport access vlan 10
! Trunk port
interface GigabitEthernet0/1
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30`,
    jobTypes: ["Networking"],
    difficulty: "Intermediate",
    tags: ["VLAN", "802.1Q", "trunk", "access port", "Cisco", "segmentation"]
  },
  {
    id: 27,
    category: "2. Networking Fundamentals",
    subcategory: "Routing",
    question: "What is the difference between static routing and dynamic routing?",
    answer: `Static Routing:
• Manually configured by admin
• No routing protocol overhead
• Predictable, secure
• No automatic failover
• Use case: small networks, stub routes, default route

Dynamic Routing:
• Routers exchange routing info automatically
• Adapts to topology changes
• Protocols:
  - RIP v2 (distance vector, max 15 hops, legacy)
  - OSPF (link state, scalable, fast convergence, area-based)
  - EIGRP (Cisco proprietary hybrid, fast)
  - BGP (path vector, internet backbone, inter-AS)

Administrative Distance (lower = preferred):
Connected=0, Static=1, OSPF=110, RIP=120, BGP(eBGP)=20`,
    codeSnippet: `! Static default route
ip route 0.0.0.0 0.0.0.0 192.168.1.1

! OSPF configuration
router ospf 1
 network 10.0.0.0 0.0.0.255 area 0
 network 192.168.1.0 0.0.0.255 area 0`,
    jobTypes: ["Networking"],
    difficulty: "Intermediate",
    tags: ["routing", "OSPF", "BGP", "static route", "CCNA"]
  },
  {
    id: 28,
    category: "2. Networking Fundamentals",
    subcategory: "Switching",
    question: "How does a switch learn MAC addresses and forward frames?",
    answer: `Switch MAC learning & forwarding:
1. Frame arrives on port → switch reads source MAC
2. Switch adds MAC → Port mapping to MAC Address Table (CAM table)
3. Switch checks destination MAC in CAM table:
   - Found → unicast to that port only (forwarding)
   - Not found → flood to all ports except source (flooding)
   - Broadcast/Multicast → always flood

STP (Spanning Tree Protocol):
• Prevents Layer 2 loops in redundant switch topologies
• Elects Root Bridge (lowest Bridge ID)
• Blocks redundant paths; activates on failure
• RSTP (802.1w) = faster convergence (< 1 sec vs STP 30-50 sec)`,
    jobTypes: ["Networking"],
    difficulty: "Intermediate",
    tags: ["switch", "MAC address", "CAM table", "STP", "RSTP", "forwarding"]
  },
  {
    id: 29,
    category: "2. Networking Fundamentals",
    subcategory: "Wireless",
    question: "What are the differences between Wi-Fi standards (802.11 a/b/g/n/ac/ax)?",
    answer: `Wi-Fi Standard comparison:
Standard | Band       | Max Speed | Key Feature
802.11b  | 2.4GHz     | 11 Mbps   | Legacy (obsolete)
802.11g  | 2.4GHz     | 54 Mbps   | Backward compat with b
802.11n  | 2.4/5GHz   | 600 Mbps  | MIMO introduced
802.11ac | 5GHz       | 3.5 Gbps  | MU-MIMO, beamforming (Wi-Fi 5)
802.11ax | 2.4/5/6GHz | 9.6 Gbps  | OFDMA, Wi-Fi 6/6E, dense environments

Security protocols:
• WEP – broken, never use
• WPA – TKIP, deprecated
• WPA2 – AES/CCMP, current standard
• WPA3 – SAE (replaces PSK), stronger, latest`,
    jobTypes: ["Networking", "IT Support"],
    difficulty: "Beginner",
    tags: ["Wi-Fi", "802.11", "wireless", "WPA2", "WPA3", "SSID"]
  },
  {
    id: 30,
    category: "2. Networking Fundamentals",
    subcategory: "Firewalls",
    question: "What are the types of firewalls and how do they work?",
    answer: `Firewall types:
1. Packet Filter – inspects headers only (IP, port) – Layer 3/4, stateless
2. Stateful Inspection – tracks connection state, allows return traffic
3. Application/Proxy – deep packet inspection, understands application protocols
4. NGFW (Next-Gen Firewall) – stateful + IPS + app awareness + SSL inspection (Palo Alto, Fortinet, Check Point)
5. WAF (Web App Firewall) – protects web apps from OWASP Top 10 (Layer 7)

Common Zones:
• LAN (trusted), WAN (untrusted), DMZ (semi-trusted for servers)

Rules read top-down – first match wins. Always end with an implicit deny all.`,
    jobTypes: ["Networking", "Security"],
    difficulty: "Intermediate",
    tags: ["firewall", "NGFW", "stateful", "ACL", "zones", "DMZ"]
  },
  {
    id: 31,
    category: "2. Networking Fundamentals",
    subcategory: "NAT",
    question: "What is NAT and what are its types?",
    answer: `NAT (Network Address Translation) maps private IP addresses to public IP addresses.

Types:
• Static NAT – 1:1 mapping (one private IP → one public IP)
• Dynamic NAT – pool of public IPs assigned as needed
• PAT / NAT Overload – many private IPs share one public IP via port numbers (most common – home routers)

Why NAT?
• IPv4 address exhaustion (conservation)
• Security: internal IPs hidden from internet
• Enables internet access from private RFC1918 space

Drawback: breaks end-to-end connectivity (IPSec NAT-T workaround needed for VPN).`,
    codeSnippet: `! Cisco PAT (overload)
ip nat inside source list 1 interface GigabitEthernet0/0 overload
access-list 1 permit 192.168.1.0 0.0.0.255
interface GigabitEthernet0/0
 ip nat outside
interface GigabitEthernet0/1
 ip nat inside`,
    jobTypes: ["Networking"],
    difficulty: "Intermediate",
    tags: ["NAT", "PAT", "IPv4", "routing", "Cisco"]
  },
  {
    id: 32,
    category: "2. Networking Fundamentals",
    subcategory: "Diagnostics",
    question: "What are the key network diagnostic commands and what do they test?",
    answer: `Essential commands:
Command              | Purpose
---------------------------------------------------------
ping <IP/host>       | ICMP echo – reachability & latency
tracert / traceroute | Hop-by-hop path to destination
ipconfig /all        | Local IP, MAC, DNS, gateway (Windows)
ifconfig / ip addr   | Linux equivalent
nslookup / dig       | DNS lookup and query
netstat -an          | Active connections and listening ports
arp -a               | ARP cache (IP → MAC mappings)
route print / ip route show | Routing table
nmap -sV <target>    | Port scan & service detection
Wireshark / tcpdump  | Packet capture and analysis`,
    codeSnippet: `# Linux full network diagnostic
ip addr show
ip route show
ping -c 4 8.8.8.8
traceroute 8.8.8.8
nslookup google.com
netstat -tulnp`,
    jobTypes: ["Networking", "IT Support"],
    difficulty: "Beginner",
    tags: ["ping", "tracert", "nslookup", "netstat", "diagnostic", "commands"]
  },
  {
    id: 33,
    category: "2. Networking Fundamentals",
    subcategory: "VPN",
    question: "What are the main VPN types and when would you use each?",
    answer: `VPN Types:
1. Site-to-Site VPN (IPSec) – connects two office networks over internet permanently. Uses IKEv2/IPSec tunnels.
2. Remote Access VPN – individual users connect to corporate network. SSL VPN (TCP 443) or IPSec (UDP 500/4500).
3. Split Tunnel – only corporate traffic via VPN; internet goes direct (reduces bandwidth).
4. Full Tunnel – all traffic via VPN (more secure, auditable).
5. SD-WAN – replaces MPLS, intelligent traffic routing over multiple ISPs.

Products: Cisco AnyConnect, GlobalProtect (Palo Alto), FortiClient, OpenVPN, WireGuard (modern, fast).`,
    jobTypes: ["Networking", "IT Support"],
    difficulty: "Intermediate",
    tags: ["VPN", "IPSec", "SSL VPN", "site-to-site", "remote access"]
  },
  {
    id: 34,
    category: "2. Networking Fundamentals",
    subcategory: "QoS",
    question: "What is QoS and why is it important for VoIP?",
    answer: `QoS (Quality of Service) prioritises network traffic to ensure critical applications get bandwidth and low latency.

VoIP requirements:
• Latency < 150ms one-way
• Jitter < 30ms
• Packet loss < 1%

QoS mechanisms:
• Classification & Marking (DSCP, CoS tags)
• Queuing: CBWFQ, LLQ (voice in priority queue)
• Traffic shaping/policing
• DSCP AF41 for video, EF (46) for voice

Without QoS: file transfers starve voice traffic → choppy calls, echo.`,
    jobTypes: ["Networking"],
    difficulty: "Advanced",
    tags: ["QoS", "VoIP", "DSCP", "jitter", "latency", "LLQ"]
  },
  {
    id: 35,
    category: "2. Networking Fundamentals",
    subcategory: "Spanning Tree",
    question: "What problem does Spanning Tree Protocol solve and how does it work?",
    answer: `Problem: Layer 2 loops cause broadcast storms (frames loop forever, saturating the network).

STP (802.1D) solution:
1. Elect Root Bridge (lowest Bridge ID = Priority + MAC)
2. Each non-root switch finds its Root Port (lowest cost path to Root)
3. Per-segment Designated Port elected (forwards frames toward root)
4. All other ports Blocked (no forwarding)

Port states: Blocking → Listening → Learning → Forwarding (50 sec total in STP)
RSTP (802.1w): ports reach Forwarding in < 1 second via proposal/agreement.

PortFast: skip STP convergence on access ports (end devices). Always enable with BPDU Guard.`,
    codeSnippet: `! Enable RSTP globally
spanning-tree mode rapid-pvst
! PortFast + BPDU Guard on access port
interface Fa0/1
 spanning-tree portfast
 spanning-tree bpduguard enable`,
    jobTypes: ["Networking"],
    difficulty: "Intermediate",
    tags: ["STP", "RSTP", "spanning tree", "loop prevention", "Cisco"]
  },
  {
    id: 36,
    category: "2. Networking Fundamentals",
    subcategory: "IPv6",
    question: "What are the key differences between IPv4 and IPv6?",
    answer: `Feature         | IPv4              | IPv6
Address length  | 32-bit (4.3B)     | 128-bit (340 undecillion)
Notation        | Dotted decimal    | Hex colon (2001:db8::1)
Header          | Variable (20-60B) | Fixed 40 bytes (simpler)
DHCP            | DHCP server       | SLAAC (Stateless) or DHCPv6
NAT             | Required          | Not needed (every device gets public IP)
Broadcast       | Yes               | No (replaced by Multicast/Anycast)
Security        | Optional          | IPSec built-in
Special addrs   | 127.0.0.1 loopback| ::1 loopback, fe80::/10 link-local

Dual-stack: run IPv4 + IPv6 simultaneously during transition.`,
    jobTypes: ["Networking"],
    difficulty: "Intermediate",
    tags: ["IPv6", "IPv4", "SLAAC", "addressing", "dual-stack"]
  },
  {
    id: 37,
    category: "2. Networking Fundamentals",
    subcategory: "Wireless Security",
    question: "How do you secure a corporate wireless network?",
    answer: `Corporate Wi-Fi security best practices:
1. Use WPA3-Enterprise (802.1X + RADIUS authentication)
2. Separate SSIDs: Corp (WPA3-Ent), Guest (isolated VLAN), IoT (isolated)
3. RADIUS server (NPS on Windows / FreeRADIUS) for user authentication
4. Disable WPS (vulnerable to brute force)
5. Change default SSID and admin credentials on APs
6. Enable Rogue AP detection
7. Certificate-based EAP-TLS for strongest auth (no passwords)
8. Regular wireless site surveys (eliminate dead zones, rogue devices)
9. Captive portal for guest network with terms acceptance`,
    jobTypes: ["Networking", "Security"],
    difficulty: "Advanced",
    tags: ["Wi-Fi security", "WPA3", "802.1X", "RADIUS", "EAP", "corporate"]
  },
  {
    id: 38,
    category: "2. Networking Fundamentals",
    subcategory: "Network Monitoring",
    question: "What tools and protocols are used for network monitoring?",
    answer: `Monitoring protocols:
• SNMP v3 – polls device metrics (CPU, bandwidth, errors) securely
• NetFlow/sFlow/IPFIX – traffic flow analysis
• Syslog – event/error logs from devices
• ICMP – ping-based availability checks

Monitoring tools:
• SolarWinds NPM – enterprise NMS
• PRTG – all-in-one monitoring (free tier available)
• Zabbix / Nagios – open-source
• LibreNMS – network-focused open-source
• Wireshark – packet-level analysis
• Grafana + InfluxDB – time-series dashboards
• Cisco DNA Center / Meraki Dashboard`,
    jobTypes: ["Networking", "Sysadmin"],
    difficulty: "Intermediate",
    tags: ["SNMP", "NetFlow", "Syslog", "Zabbix", "PRTG", "monitoring"]
  },
  {
    id: 39,
    category: "2. Networking Fundamentals",
    subcategory: "Load Balancing",
    question: "What is load balancing and what algorithms are used?",
    answer: `Load balancing distributes incoming traffic across multiple servers to ensure availability and performance.

Types:
• Layer 4 LB – routes based on IP/port (fast, no content inspection)
• Layer 7 LB – routes based on URL, headers, cookies (smarter, more features)

Algorithms:
• Round Robin – equal turn-by-turn distribution
• Weighted Round Robin – higher-capacity servers get more requests
• Least Connections – new request goes to server with fewest active connections
• IP Hash – same client always hits same server (session persistence)
• Health Checks – removes unhealthy servers from pool

Products: Nginx, HAProxy, F5 BIG-IP, AWS ALB/NLB, Azure Load Balancer.`,
    jobTypes: ["Networking", "Cloud"],
    difficulty: "Advanced",
    tags: ["load balancing", "HAProxy", "Nginx", "F5", "round robin", "HA"]
  },
  {
    id: 40,
    category: "2. Networking Fundamentals",
    subcategory: "Protocols",
    question: "What are the most important network ports every IT tech must know?",
    answer: `Well-known ports (0-1023):
Port | Protocol | Service
21   | TCP      | FTP (File Transfer)
22   | TCP      | SSH (Secure Shell)
23   | TCP      | Telnet (insecure – avoid)
25   | TCP      | SMTP (email send)
53   | TCP/UDP  | DNS
67/68| UDP      | DHCP (server/client)
80   | TCP      | HTTP
110  | TCP      | POP3 (email receive)
143  | TCP      | IMAP
443  | TCP      | HTTPS
445  | TCP      | SMB (file sharing)
3389 | TCP      | RDP (Remote Desktop)
3306 | TCP      | MySQL
5432 | TCP      | PostgreSQL
8080 | TCP      | HTTP Alternate / Proxy`,
    jobTypes: ["Networking", "IT Support", "Security"],
    difficulty: "Beginner",
    tags: ["ports", "TCP", "UDP", "protocols", "HTTP", "SSH", "RDP", "DNS"]
  },
  {
    id: 41,
    category: "2. Networking Fundamentals",
    subcategory: "ARP",
    question: "What is ARP and what is an ARP poisoning attack?",
    answer: `ARP (Address Resolution Protocol) resolves IPv4 addresses to MAC addresses within a LAN.

Process:
1. PC wants to send to 192.168.1.1 but doesn't know its MAC
2. Broadcasts ARP Request: "Who has 192.168.1.1?"
3. Target replies with its MAC address (ARP Reply)
4. Sender caches IP-to-MAC in ARP table for TTL duration

ARP Poisoning (ARP Spoofing):
• Attacker sends fake ARP replies to poison caches
• Causes Man-in-the-Middle (MitM) attack
• All traffic from victim flows through attacker

Mitigations: Dynamic ARP Inspection (DAI) on switches, static ARP entries, network monitoring.`,
    codeSnippet: `# View ARP table
arp -a           # Windows
arp -n           # Linux
# Cisco DAI
ip arp inspection vlan 10`,
    jobTypes: ["Networking", "Security"],
    difficulty: "Intermediate",
    tags: ["ARP", "ARP poisoning", "MitM", "DAI", "security", "networking"]
  },
  {
    id: 42,
    category: "2. Networking Fundamentals",
    subcategory: "Cabling",
    question: "What are the different types of network cables and when to use each?",
    answer: `Copper (Ethernet):
• Cat5e – up to 1 Gbps / 100m (legacy)
• Cat6 – up to 10 Gbps / 55m (current standard)
• Cat6A – up to 10 Gbps / 100m (recommended for new installs)
• Cat7/8 – data center, up to 40Gbps

Fiber Optic:
• SMF (Single-Mode) – long distance (campus, WAN, >550m), yellow jacket
• MMF (Multi-Mode) – short distance (within building), orange/aqua jacket
• LC, SC, ST, MPO connectors

Crossover vs Straight-through (mostly obsolete with Auto-MDIX):
• Straight-through: PC → Switch, Switch → Router
• Crossover: PC → PC, Switch → Switch (legacy; MDI-X eliminates need)`,
    jobTypes: ["IT Support", "Networking"],
    difficulty: "Beginner",
    tags: ["cabling", "Cat6", "fiber", "SMF", "MMF", "Ethernet"]
  },
  {
    id: 43,
    category: "2. Networking Fundamentals",
    subcategory: "BGP",
    question: "What is BGP and where is it used?",
    answer: `BGP (Border Gateway Protocol) is the internet's routing protocol – the "postal service of the internet."

Key facts:
• Path-vector protocol (not distance vector or link-state)
• Used between Autonomous Systems (AS) – e.g. ISPs, large enterprises
• eBGP: between different AS numbers; iBGP: within same AS
• Selects best path based on attributes (AS-PATH, LOCAL_PREF, MED, etc.)
• Very stable and scalable; slow convergence by design

Multi-homing: connect to multiple ISPs using BGP for redundancy.
BGP hijacking: malicious AS announces wrong routes (major internet incident vector).`,
    jobTypes: ["Networking"],
    difficulty: "Advanced",
    tags: ["BGP", "routing", "autonomous system", "internet", "CCNP"]
  },
  {
    id: 44,
    category: "2. Networking Fundamentals",
    subcategory: "SD-WAN",
    question: "What is SD-WAN and how does it improve on traditional WAN?",
    answer: `SD-WAN (Software-Defined WAN) decouples WAN management from hardware.

Traditional WAN problems:
• Expensive MPLS circuits
• Manual router configuration
• No intelligent path selection

SD-WAN advantages:
• Uses any transport: MPLS, broadband, 4G/5G, fiber
• Intelligent path selection per application (VoIP via MPLS, video via internet)
• Centralised policy management
• Automatic failover (sub-second)
• Zero-touch provisioning for remote sites
• Built-in security (encryption, firewall integration)

Vendors: Cisco Viptela, VMware Velocloud, Fortinet SD-WAN, Silver Peak (Aruba), Meraki SD-WAN.`,
    jobTypes: ["Networking"],
    difficulty: "Advanced",
    tags: ["SD-WAN", "WAN", "MPLS", "Cisco", "networking"]
  },
  {
    id: 45,
    category: "2. Networking Fundamentals",
    subcategory: "SNMP",
    question: "How does SNMP work and what are the versions?",
    answer: `SNMP (Simple Network Management Protocol) monitors and manages network devices.

Components:
• Manager (NMS) – monitoring server (SolarWinds, Zabbix)
• Agent – software on device (router, switch, server)
• MIB (Management Information Base) – database of measurable OIDs
• OID – unique identifier for a metric (e.g. interface traffic counter)

Operations:
• GET – NMS polls device for value
• SET – NMS configures device parameter
• TRAP – device proactively alerts NMS on event

Versions:
• v1 – cleartext community strings (insecure)
• v2c – 64-bit counters, still cleartext
• v3 – authentication (SHA) + encryption (AES) – USE THIS`,
    codeSnippet: `# SNMP v3 on Cisco IOS
snmp-server group MYGROUP v3 priv
snmp-server user MYUSER MYGROUP v3 auth sha AUTH_PASS priv aes 128 PRIV_PASS
snmp-server host 10.0.0.100 version 3 priv MYUSER`,
    jobTypes: ["Networking", "Sysadmin"],
    difficulty: "Intermediate",
    tags: ["SNMP", "monitoring", "MIB", "OID", "network management"]
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. WINDOWS SERVER & ACTIVE DIRECTORY (46 – 60)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 46,
    category: "3. Windows Server & AD",
    subcategory: "Active Directory",
    question: "What is Active Directory and what are its core components?",
    answer: `Active Directory (AD) is Microsoft's directory service for managing users, computers, and resources in a domain.

Core components:
• Domain – administrative boundary (e.g. company.com)
• Forest – collection of domains sharing trust (top-level container)
• Tree – hierarchy of domains within a forest
• OU (Organisational Unit) – logical container for objects (users, computers, groups)
• DC (Domain Controller) – server running AD DS, authenticates users
• DNS – required; AD is DNS-dependent
• LDAP – protocol AD uses for queries
• Kerberos – authentication protocol (tickets, not passwords on network)
• SYSVOL / NETLOGON – shared folders for GPO files & logon scripts`,
    jobTypes: ["Sysadmin", "IT Support"],
    difficulty: "Intermediate",
    tags: ["Active Directory", "domain", "OU", "DC", "Kerberos", "LDAP"]
  },
  {
    id: 47,
    category: "3. Windows Server & AD",
    subcategory: "Group Policy",
    question: "What is Group Policy and how is it applied?",
    answer: `Group Policy (GPO) centrally configures settings for users and computers in AD.

Application order (LSDOU – last wins):
1. Local Policy
2. Site GPO
3. Domain GPO
4. OU GPO (nested OUs – innermost last = wins)

Key concepts:
• Computer Configuration – applied at startup
• User Configuration – applied at logon
• gpupdate /force – manually apply latest GPOs
• gpresult /r – show applied GPOs for current user/computer
• Loopback processing – apply user GPOs based on computer OU (e.g. kiosk)
• Security filtering – apply GPO only to specific groups
• WMI filtering – apply GPO based on hardware/OS conditions`,
    codeSnippet: `# Force Group Policy refresh
gpupdate /force

# View applied GPOs
gpresult /r
gpresult /h C:\\report.html /f

# Check GPO events
Get-WinEvent -LogName "Microsoft-Windows-GroupPolicy/Operational" | Select -First 20`,
    jobTypes: ["Sysadmin", "IT Support"],
    difficulty: "Intermediate",
    tags: ["Group Policy", "GPO", "LSDOU", "gpupdate", "gpresult"]
  },
  {
    id: 48,
    category: "3. Windows Server & AD",
    subcategory: "DNS",
    question: "How does DNS integration with Active Directory work?",
    answer: `AD requires DNS – domain controllers register SRV records so clients can find services.

Key DNS records AD creates:
• _ldap._tcp.domain.com – LDAP service
• _kerberos._tcp.domain.com – Kerberos KDC
• _gc._tcp.domain.com – Global Catalog

AD-Integrated DNS zones:
• Stored in AD (not flat files) – replicated automatically to all DCs
• Secure dynamic update only (prevents rogue registrations)
• Multi-master replication

Troubleshoot:
  dcdiag /test:dns /v  – DNS health check
  nslookup → set type=SRV → query _ldap._tcp.domain.com`,
    codeSnippet: `# DNS health check
dcdiag /test:dns /v

# List DNS zones
Get-DnsServerZone

# Check SRV records
nslookup
set type=SRV
_ldap._tcp.contoso.com`,
    jobTypes: ["Sysadmin"],
    difficulty: "Advanced",
    tags: ["DNS", "Active Directory", "SRV records", "AD DS", "dcdiag"]
  },
  {
    id: 49,
    category: "3. Windows Server & AD",
    subcategory: "DHCP",
    question: "How do you set up and manage DHCP on Windows Server?",
    answer: `Windows DHCP Server role:
1. Install DHCP role via Server Manager
2. Create scope (IP range, subnet mask, exclusions)
3. Configure scope options: Default gateway (003), DNS servers (006), Domain name (015)
4. Authorise DHCP in AD (prevents rogue DHCP servers)
5. Activate scope

High Availability:
• DHCP Failover – two servers share scope (Active-Passive or Load Balance)
• Split scope – 80/20 rule between two servers (legacy method)

Key PowerShell:`,
    codeSnippet: `# Get all DHCP leases
Get-DhcpServerv4Lease -ScopeId 192.168.1.0

# Add reservation
Add-DhcpServerv4Reservation -ScopeId 192.168.1.0 -IPAddress 192.168.1.50 \`
  -ClientId "AA-BB-CC-DD-EE-FF" -Description "Printer"

# Check scope statistics
Get-DhcpServerv4ScopeStatistics -ScopeId 192.168.1.0`,
    jobTypes: ["Sysadmin"],
    difficulty: "Intermediate",
    tags: ["DHCP", "Windows Server", "scope", "DHCP failover", "PowerShell"]
  },
  {
    id: 50,
    category: "3. Windows Server & AD",
    subcategory: "Replication",
    question: "What is AD replication and how do you troubleshoot it?",
    answer: `AD replication synchronises directory changes between Domain Controllers.

Intra-site replication: within a site, triggered within 15 seconds via KCC (Knowledge Consistency Checker).
Inter-site replication: between sites, via Site Links (schedule/interval configurable).

Key tools:
• repadmin /showrepl – show replication status for all partners
• repadmin /replsummary – summary of errors
• dcdiag /test:replications – automated test
• Event Viewer: Directory Service log (ID 1311, 1864 = replication failures)

Common issues: DNS failure (most common), firewall blocking TCP 135+dynamic ports, USN rollback.`,
    codeSnippet: `# Check replication status
repadmin /showrepl
repadmin /replsummary
repadmin /syncall /AdeP  # Force sync all partitions

# Full DC health check
dcdiag /v /c /e`,
    jobTypes: ["Sysadmin"],
    difficulty: "Advanced",
    tags: ["AD replication", "repadmin", "dcdiag", "domain controller", "KCC"]
  },
  {
    id: 51,
    category: "3. Windows Server & AD",
    subcategory: "Roles & Features",
    question: "What are the common Windows Server roles and their purposes?",
    answer: `Key Server Roles:
Role                    | Purpose
AD DS                   | Active Directory domain services
AD CS                   | Certificate Authority (PKI)
AD FS                   | Federation Services (SSO with external apps)
DNS                     | Name resolution
DHCP                    | IP address assignment
File & Storage Services | SMB file shares, DFS
Web Server (IIS)        | Host web applications
Remote Desktop Services | VDI / remote app publishing
Hyper-V                 | Virtualisation platform
WSUS                    | Windows Update management
NPS (RADIUS)            | 802.1X / VPN authentication server
Print & Document        | Central print server management`,
    jobTypes: ["Sysadmin"],
    difficulty: "Beginner",
    tags: ["Windows Server", "roles", "AD DS", "DNS", "DHCP", "Hyper-V"]
  },
  {
    id: 52,
    category: "3. Windows Server & AD",
    subcategory: "PowerShell",
    question: "What are essential PowerShell commands every sysadmin must know?",
    answer: `AD Management:
Get-ADUser, New-ADUser, Set-ADUser, Remove-ADUser
Get-ADGroup, Add-ADGroupMember
Get-ADComputer, Move-ADObject

System:
Get-Service / Start-Service / Stop-Service
Get-Process / Stop-Process
Get-EventLog / Get-WinEvent
Restart-Computer / Shutdown-Computer

File & Disk:
Get-ChildItem (ls), Copy-Item, Move-Item, Remove-Item
Get-PSDrive, Get-Volume

Network:
Test-NetConnection -ComputerName host -Port 443
Resolve-DnsName domain.com
Get-NetIPAddress, Get-NetAdapter`,
    codeSnippet: `# Bulk disable inactive users (90+ days)
$cutoff = (Get-Date).AddDays(-90)
Search-ADAccount -AccountInactive -TimeSpan 90 -UsersOnly |
  Where-Object {$_.Enabled -eq $true} |
  Disable-ADAccount -WhatIf  # Remove -WhatIf to execute

# Export all AD users to CSV
Get-ADUser -Filter * -Properties EmailAddress,Department,Title |
  Select Name,SamAccountName,EmailAddress,Department,Title |
  Export-Csv C:\\users_export.csv -NoTypeInformation`,
    jobTypes: ["Sysadmin"],
    difficulty: "Intermediate",
    tags: ["PowerShell", "Active Directory", "automation", "scripting", "sysadmin"]
  },
  {
    id: 53,
    category: "3. Windows Server & AD",
    subcategory: "Backup & Recovery",
    question: "How do you back up and restore Active Directory?",
    answer: `AD Backup best practices:
• Backup System State (includes AD, SYSVOL, Registry, boot files)
• Use Windows Server Backup or third-party (Veeam, Acronis)
• Store backups offsite / on separate media
• Test restoration regularly

AD Restore Types:
1. Non-Authoritative Restore – default; restored DC replicates from other DCs (restores to current state)
2. Authoritative Restore – marks objects as authoritative to replicate to all DCs (recover deleted OU/users)

Recycle Bin (AD 2008 R2+):
• Enable via AD Administrative Center
• Restore deleted objects without restarting DCs (180-day tombstone lifetime)`,
    codeSnippet: `# Enable AD Recycle Bin
Enable-ADOptionalFeature "Recycle Bin Feature" -Scope ForestOrConfigurationSet -Target "contoso.com"

# Restore deleted user
Get-ADObject -Filter {displayName -eq "John Doe"} -IncludeDeletedObjects |
  Restore-ADObject`,
    jobTypes: ["Sysadmin"],
    difficulty: "Advanced",
    tags: ["AD backup", "System State", "AD Recycle Bin", "disaster recovery"]
  },
  {
    id: 54,
    category: "3. Windows Server & AD",
    subcategory: "Security",
    question: "What is the principle of least privilege and how is it applied in AD?",
    answer: `Least Privilege: give users and accounts only the minimum permissions required to do their job.

AD implementation:
• Role-Based Access Control (RBAC) via AD security groups
• Delegate specific AD permissions using ADUC → Delegation of Control Wizard
• Privileged Access Workstations (PAW) for admin tasks
• Tiered Admin Model: Tier 0 (DC admin), Tier 1 (Server admin), Tier 2 (Workstation admin) – no cross-tier logins
• Service accounts: Managed Service Accounts (MSA) / Group MSA (gMSA) – auto-rotating passwords
• Audit sensitive group membership changes (Domain Admins, Enterprise Admins)`,
    jobTypes: ["Sysadmin", "Security"],
    difficulty: "Advanced",
    tags: ["least privilege", "RBAC", "gMSA", "tiered admin", "delegation"]
  },
  {
    id: 55,
    category: "3. Windows Server & AD",
    subcategory: "Certificates",
    question: "What is PKI and AD Certificate Services?",
    answer: `PKI (Public Key Infrastructure) uses certificates to enable encryption and authentication.

AD CS roles:
• Root CA – trust anchor (take offline after setup for security)
• Subordinate/Issuing CA – issues certificates to users/devices
• Online Responder (OCSP) – certificate validity checking
• NDES – certificate enrollment for network devices

Use cases:
• Wi-Fi authentication (EAP-TLS certificates)
• Smart card / Windows Hello logon
• HTTPS for internal sites
• Code signing
• Email encryption (S/MIME)
• VPN certificate auth`,
    jobTypes: ["Sysadmin", "Security"],
    difficulty: "Advanced",
    tags: ["PKI", "AD CS", "certificates", "CA", "EAP-TLS", "HTTPS"]
  },
  {
    id: 56,
    category: "3. Windows Server & AD",
    subcategory: "Azure AD",
    question: "What is Azure Active Directory and how does it differ from on-prem AD?",
    answer: `Azure AD (Entra ID) is Microsoft's cloud identity platform.

Key differences:
Feature          | On-Prem AD          | Azure AD
Protocol         | Kerberos/NTLM/LDAP  | OAuth2, SAML, OpenID Connect
Structure        | OUs, Domains        | Flat (no OUs) – managed via groups
Devices          | Domain join         | Azure AD join / Hybrid join
GPO              | Yes                 | Intune / Configuration Profiles
On-prem required | Yes                 | No (cloud-only possible)

Azure AD Connect: synchronises on-prem AD to Azure AD (hybrid identity).
SSO: One login for Microsoft 365, Azure, and 3rd-party SaaS apps via Azure AD.`,
    jobTypes: ["Sysadmin", "Cloud"],
    difficulty: "Intermediate",
    tags: ["Azure AD", "Entra ID", "hybrid identity", "Azure AD Connect", "SSO"]
  },
  {
    id: 57,
    category: "3. Windows Server & AD",
    subcategory: "File Services",
    question: "What is DFS and how does it improve file sharing?",
    answer: `DFS (Distributed File System) provides a unified namespace for file shares across multiple servers.

DFS Namespaces:
• \\\\domain\\shares → maps to actual \\\\server1\\data (transparent to users)
• Users always access same path even if servers change
• Namespace = single entry point for multiple shares

DFS Replication:
• Keeps files synchronised between multiple servers
• Replaces FRS (File Replication Service) for SYSVOL in newer domains
• Uses compression (RDC – Remote Differential Compression)
• Good for: multi-site file replication, SYSVOL replication`,
    codeSnippet: `# Check DFS Replication health
dfsrdiag ReplicationState /member:SERVER1
Get-DfsReplicatedFolder
Get-DfsrMembership -GroupName "DFS-Share"`,
    jobTypes: ["Sysadmin"],
    difficulty: "Advanced",
    tags: ["DFS", "file sharing", "replication", "namespace", "SYSVOL"]
  },
  {
    id: 58,
    category: "3. Windows Server & AD",
    subcategory: "Monitoring",
    question: "How do you monitor Windows Server health and performance?",
    answer: `Built-in tools:
• Task Manager – quick CPU/RAM/Disk/Network snapshot
• Resource Monitor – per-process detail
• Performance Monitor (perfmon) – counter logging, baselines
• Reliability Monitor – stability history
• Event Viewer – System, Application, Security, AD logs
• Server Manager – server inventory status

Advanced / Enterprise:
• SCOM (System Center Operations Manager) – enterprise monitoring
• Windows Admin Center – modern browser-based management
• Datadog, Zabbix, PRTG – third-party with alerting
• Azure Monitor + Log Analytics – for hybrid environments`,
    jobTypes: ["Sysadmin"],
    difficulty: "Intermediate",
    tags: ["monitoring", "Event Viewer", "Performance Monitor", "SCOM", "Windows"]
  },
  {
    id: 59,
    category: "3. Windows Server & AD",
    subcategory: "Hyper-V",
    question: "What is Hyper-V and how do you create a virtual machine?",
    answer: `Hyper-V is Microsoft's Type 1 hypervisor (bare-metal) built into Windows Server.

Key concepts:
• VM (Virtual Machine) – isolated OS instance with dedicated vCPU, vRAM, vDisk
• VHD/VHDX – virtual disk files
• Virtual Switch – connects VMs to network (External/Internal/Private)
• Snapshots/Checkpoints – point-in-time restore
• Live Migration – move running VM between Hyper-V hosts (requires clustering)

Create VM (PowerShell):`,
    codeSnippet: `# Create new VM
New-VM -Name "WebServer01" -MemoryStartupBytes 4GB -Generation 2 \`
  -VHDPath "C:\\VMs\\WebServer01.vhdx" -NewVHDSizeBytes 60GB \`
  -SwitchName "External Switch"

# Start VM
Start-VM -Name "WebServer01"

# Get all VMs and state
Get-VM | Select Name, State, MemoryAssigned`,
    jobTypes: ["Sysadmin", "Cloud"],
    difficulty: "Intermediate",
    tags: ["Hyper-V", "virtualisation", "VM", "VHDX", "PowerShell"]
  },
  {
    id: 60,
    category: "3. Windows Server & AD",
    subcategory: "IIS",
    question: "How do you configure IIS to host a website with HTTPS?",
    answer: `IIS (Internet Information Services) – Microsoft web server.

Setup steps:
1. Install Web Server (IIS) role
2. Create site in IIS Manager → Sites → Add Website
3. Set physical path, IP, port, host header
4. Install SSL certificate (from AD CS or public CA)
5. Add HTTPS binding (port 443) and assign certificate
6. Add HTTP → HTTPS redirect via URL Rewrite module

Key files:
• web.config – per-site configuration (URL rewrite, auth, mime types)
• applicationHost.config – server-wide settings (C:\\Windows\\System32\\inetsrv\\config)`,
    codeSnippet: `# PowerShell IIS management (WebAdministration module)
Import-Module WebAdministration
New-Website -Name "MySite" -Port 80 -PhysicalPath "C:\\inetpub\\mysite"
New-WebBinding -Name "MySite" -Protocol "https" -Port 443 -IPAddress "*"
# Assign cert
$cert = Get-ChildItem Cert:\\LocalMachine\\My | Where-Object {$_.Subject -match "mysite.com"}
(Get-WebBinding "MySite" -Protocol "https").AddSslCertificate($cert.Thumbprint, "My")`,
    jobTypes: ["Sysadmin"],
    difficulty: "Intermediate",
    tags: ["IIS", "HTTPS", "SSL", "web server", "Windows Server"]
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. HARDWARE & INFRASTRUCTURE (61 – 70)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 61,
    category: "4. Hardware & Infrastructure",
    subcategory: "RAID",
    question: "What are the common RAID levels and when to use each?",
    answer: `RAID (Redundant Array of Independent Disks):

Level | Min Disks | Fault Tolerance | Capacity    | Use Case
RAID 0 | 2        | None            | 100%         | Speed, no redundancy (temp data)
RAID 1 | 2        | 1 disk failure  | 50%          | OS drive, critical data pairs
RAID 5 | 3        | 1 disk failure  | (n-1)/n      | File/app servers (good balance)
RAID 6 | 4        | 2 disk failures | (n-2)/n      | Large arrays where rebuild risk is high
RAID 10| 4        | 1 per mirror    | 50%          | Databases (performance + redundancy)

Note: RAID is NOT a backup! Protects against hardware failure only, not deletion or corruption.`,
    jobTypes: ["Sysadmin", "General IT"],
    difficulty: "Intermediate",
    tags: ["RAID", "storage", "hardware", "disk", "server infrastructure"]
  },
  {
    id: 62,
    category: "4. Hardware & Infrastructure",
    subcategory: "Server Hardware",
    question: "What are the key components of a server and how do they differ from desktop PCs?",
    answer: `Server vs Desktop differences:

• Form factor: Rack (1U/2U), Blade, Tower servers vs desktop cases
• ECC RAM (Error-Correcting Code) – detects and corrects single-bit errors (reliability)
• Multiple CPUs / high core count (EPYC, Xeon)
• Hot-swappable HDDs and PSUs (no downtime for replacement)
• Redundant PSUs (dual power supply for HA)
• RAID controller (hardware RAID)
• BMC/iDRAC/iLO – out-of-band management (remote console even if OS hangs)
• Higher I/O: 10GbE / 25GbE NICs vs 1GbE desktop
• SAS HDDs (enterprise) vs SATA/NVMe
• Purpose-built BIOS (UEFI with server management extensions)`,
    jobTypes: ["Sysadmin", "IT Support"],
    difficulty: "Beginner",
    tags: ["server hardware", "ECC RAM", "RAID", "iDRAC", "iLO", "rack"]
  },
  {
    id: 63,
    category: "4. Hardware & Infrastructure",
    subcategory: "Power",
    question: "What is a UPS and why is it critical in a data centre?",
    answer: `UPS (Uninterruptible Power Supply) provides emergency power during mains failure.

Functions:
• Instant switchover (< 10ms) to battery on power loss
• Protects against surges, spikes, sags, and brownouts
• Provides time to gracefully shut down systems
• Prevents data corruption and hardware damage

Types:
• Offline/Standby – basic, has transfer time delay
• Line-Interactive – conditions power, protects against sags/surges
• Online/Double-Conversion – continuous clean power (data centres use this)

Data centre best practices:
• N+1 UPS redundancy
• Generator backup (for extended outages)
• Periodic battery testing
• UPS monitoring via SNMP (APC PowerChute, Eaton IPM)`,
    jobTypes: ["Sysadmin", "General IT"],
    difficulty: "Beginner",
    tags: ["UPS", "power", "data centre", "battery", "infrastructure"]
  },
  {
    id: 64,
    category: "4. Hardware & Infrastructure",
    subcategory: "Storage",
    question: "What is the difference between SAN, NAS, and DAS storage?",
    answer: `DAS (Direct-Attached Storage):
• HDD/SSD directly inside or directly cabled to server
• Fastest; not shared; no network overhead
• RAID internal to server

NAS (Network-Attached Storage):
• Dedicated file server on the LAN
• Shares files via SMB (Windows), NFS (Linux)
• Easy to manage, good for file sharing
• Examples: Synology, QNAP, Windows File Server

SAN (Storage Area Network):
• Dedicated high-speed storage network (Fibre Channel or iSCSI)
• Block-level storage (appears as local disk to server)
• High performance for databases (SQL, Oracle)
• More complex and expensive`,
    jobTypes: ["Sysadmin"],
    difficulty: "Intermediate",
    tags: ["SAN", "NAS", "DAS", "storage", "iSCSI", "SMB", "NFS"]
  },
  {
    id: 65,
    category: "4. Hardware & Infrastructure",
    subcategory: "Rack Management",
    question: "What are best practices for server rack management?",
    answer: `Physical rack best practices:
• Document everything: rack diagram, cable labels, asset tags
• Hot aisle / cold aisle arrangement (cooling efficiency)
• Cable management: velcro, cable trays, patch panels
• PDU (Power Distribution Unit) – distribute mains in rack
• KVM switch – control multiple servers from one keyboard/mouse/monitor
• Rackmount console server / terminal server for OOB access
• Weight limits: 1U ≈ 10-20kg; racks typically 1000kg max
• Blanking panels to maintain airflow in empty rack slots
• Label both ends of every cable`,
    jobTypes: ["Sysadmin"],
    difficulty: "Beginner",
    tags: ["rack management", "data centre", "hot aisle", "cable management"]
  },
  {
    id: 66,
    category: "4. Hardware & Infrastructure",
    subcategory: "Troubleshooting",
    question: "A server is showing amber/fault LED. What is your diagnostic approach?",
    answer: `Server LED fault indicators:
• Amber/Yellow = fault detected (component level: PSU, fan, disk, memory)
• Red = critical failure (immediate action needed)
• Blue = UID (Unit ID) indicator for identifying in rack

Diagnostic steps:
1. Access iDRAC / iLO / IMM out-of-band interface → check hardware health dashboard
2. Review server event log (SEL) for error codes
3. Check specific component LEDs on PSU, NIC, hard drives
4. Identify failing component: failed HDD (RAID degraded?), failed fan, failed PSU
5. Replace hot-swappable component if in warranty/spare available
6. Contact vendor support (Dell EMC, HPE, Lenovo) with service tag

Never power off without understanding impact (check if services are running on it).`,
    jobTypes: ["Sysadmin", "IT Support"],
    difficulty: "Intermediate",
    tags: ["server LED", "iDRAC", "iLO", "hardware fault", "troubleshooting"]
  },
  {
    id: 67,
    category: "4. Hardware & Infrastructure",
    subcategory: "Cooling",
    question: "How is cooling managed in a data centre?",
    answer: `Cooling fundamentals:
• PUE (Power Usage Effectiveness) = Total Facility Power / IT Equipment Power
• Target PUE < 1.4 (world-class < 1.1 for hyperscalers)

Cooling methods:
• CRAC/CRAH units – Computer Room AC/Air Handler
• Hot aisle / cold aisle containment (keeps hot exhaust away from intake)
• Raised floor with perforated tiles (underfloor cooling)
• In-row cooling units (close-coupled, precise)
• Liquid cooling (direct-to-chip, immersion cooling) – for high-density HPC
• Free cooling / economisers – use outside air when ambient is cool

Monitoring: temperature/humidity sensors on each rack (alert if > 27°C inlet).`,
    jobTypes: ["Sysadmin"],
    difficulty: "Advanced",
    tags: ["data centre", "cooling", "hot aisle", "PUE", "CRAC", "infrastructure"]
  },
  {
    id: 68,
    category: "4. Hardware & Infrastructure",
    subcategory: "Virtualisation",
    question: "What is VMware vSphere and its core components?",
    answer: `VMware vSphere = enterprise virtualisation platform.

Core components:
• ESXi – Type 1 hypervisor (bare-metal), runs on each host
• vCenter Server – centralised management of all ESXi hosts
• VMFS (VM File System) – cluster filesystem on shared storage
• vSAN – software-defined storage across ESXi hosts
• vMotion – live migrate running VMs between hosts (zero downtime)
• HA (High Availability) – restart VMs on another host if host fails
• DRS (Distributed Resource Scheduler) – auto-balance VM load across hosts
• NSX – software-defined networking for VMs

Licensing tiers: Standard → Enterprise Plus → Cloud Foundation`,
    jobTypes: ["Sysadmin", "Cloud"],
    difficulty: "Advanced",
    tags: ["VMware", "vSphere", "ESXi", "vCenter", "vMotion", "HA", "DRS"]
  },
  {
    id: 69,
    category: "4. Hardware & Infrastructure",
    subcategory: "Monitoring",
    question: "What metrics should you monitor on a server infrastructure?",
    answer: `Critical server metrics:
Category     | Metric                     | Threshold (typical)
CPU          | Usage %                    | Alert > 85% sustained
RAM          | Usage %, page file usage   | Alert > 90%
Disk         | I/O latency (ms)           | Alert > 20ms (HDD), > 2ms (SSD)
Disk         | Free space %               | Alert < 15%
Network      | Bandwidth utilisation %    | Alert > 80%
Network      | Packet loss, error rate    | Alert any sustained errors
Temperature  | CPU/Inlet temp             | Alert > 35°C inlet, > 85°C CPU
Storage      | RAID status, disk health   | Immediate alert on degraded/failed
Services     | Process availability       | Alert if critical service stops
Backup       | Last successful backup     | Alert if > 24h`,
    jobTypes: ["Sysadmin"],
    difficulty: "Intermediate",
    tags: ["monitoring", "metrics", "CPU", "RAM", "disk", "performance"]
  },
  {
    id: 70,
    category: "4. Hardware & Infrastructure",
    subcategory: "DR",
    question: "What is the difference between RTO and RPO in disaster recovery?",
    answer: `RPO (Recovery Point Objective):
• Maximum acceptable data loss measured in time
• "How much data can we afford to lose?"
• RPO = 1 hour → must backup every hour
• Determines backup frequency

RTO (Recovery Time Objective):
• Maximum acceptable downtime before systems must be restored
• "How long can the business survive without the system?"
• RTO = 4 hours → systems must be online within 4 hours of disaster

DR Tiers:
• Tier 0 – no DR (acceptable data loss: all)
• Tier 1 – backup/restore (RTO hours-days)
• Tier 5 – hot standby (RTO minutes)
• Tier 7 – zero data loss (synchronous replication)

Test DR plans annually (tabletop, failover test, full simulation).`,
    jobTypes: ["Sysadmin", "Cloud"],
    difficulty: "Intermediate",
    tags: ["disaster recovery", "RTO", "RPO", "backup", "business continuity"]
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. IT SECURITY & COMPLIANCE (71 – 85)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 71,
    category: "5. IT Security & Compliance",
    subcategory: "Authentication",
    question: "What is MFA and why is it the most effective single security control?",
    answer: `MFA (Multi-Factor Authentication) requires two or more of:
• Something you know (password, PIN)
• Something you have (phone app, hardware token, smart card)
• Something you are (fingerprint, face, iris)

Why it's the #1 control:
• Compromised passwords alone become useless
• Microsoft reports MFA blocks 99.9% of automated account attacks
• Defeats phishing, credential stuffing, password spray

Types of MFA:
• TOTP (Time-based OTP) – Google Authenticator, Microsoft Authenticator
• Push notification – approve/deny on phone (Duo, Okta)
• Hardware token – YubiKey, RSA SecurID (phishing resistant)
• SMS OTP – convenient but weakest (SIM swap attacks possible)
• FIDO2 / Passkeys – phishing-resistant, no password needed`,
    jobTypes: ["Security", "IT Support"],
    difficulty: "Beginner",
    tags: ["MFA", "authentication", "TOTP", "YubiKey", "FIDO2", "security"]
  },
  {
    id: 72,
    category: "5. IT Security & Compliance",
    subcategory: "Malware",
    question: "What are the common types of malware and how do you defend against them?",
    answer: `Malware types:
• Virus – attaches to files, spreads on execution
• Worm – self-replicating, spreads via network (no user action needed)
• Trojan – disguised as legitimate software
• Ransomware – encrypts data, demands payment (Ryuk, LockBit, REvil)
• Spyware – monitors activity, keylogger
• Adware – unwanted advertising, often bundled
• Rootkit – hides deep in OS, hardest to remove
• Botnet – compromised devices controlled remotely

Defences:
• EDR (Endpoint Detection & Response): CrowdStrike, Defender for Endpoint, SentinelOne
• Email filtering (anti-phishing, anti-spam): Proofpoint, Mimecast
• Network segmentation + Zero Trust
• User awareness training
• Offline backups (ransomware-resistant)`,
    jobTypes: ["Security", "IT Support"],
    difficulty: "Intermediate",
    tags: ["malware", "ransomware", "virus", "EDR", "CrowdStrike", "security"]
  },
  {
    id: 73,
    category: "5. IT Security & Compliance",
    subcategory: "Zero Trust",
    question: "What is Zero Trust security and how do you implement it?",
    answer: `Zero Trust principle: "Never trust, always verify." No implicit trust based on network location.

Core pillars:
1. Verify explicitly – authenticate every user, device, every request
2. Use least privilege – minimal access per role/time
3. Assume breach – segment networks, monitor continuously

Implementation:
• Identity: MFA + Conditional Access (Azure AD)
• Devices: MDM compliance check before access (Intune)
• Network: Micro-segmentation, ZTNA (replaces VPN)
• Applications: App proxy, Zero Trust app access
• Data: Data classification, DLP, encryption at rest/transit
• Telemetry: SIEM, SOAR, continuous monitoring

Vendors: Microsoft 365 Defender, Zscaler ZPA, Palo Alto Prisma Access.`,
    jobTypes: ["Security"],
    difficulty: "Advanced",
    tags: ["Zero Trust", "ZTNA", "conditional access", "MFA", "security architecture"]
  },
  {
    id: 74,
    category: "5. IT Security & Compliance",
    subcategory: "Compliance",
    question: "What are the key IT compliance standards every technician should know?",
    answer: `Common compliance frameworks:
Standard   | Applies To            | Key Requirements
ISO 27001  | Any org               | ISMS, risk management, 114 controls
NIST CSF   | US federal / general  | Identify, Protect, Detect, Respond, Recover
PCI-DSS    | Card payment handling | Network segmentation, encryption, quarterly scans
GDPR       | EU personal data      | Data minimisation, breach notification (72h), DPO
HIPAA      | US healthcare data    | PHI protection, audit controls, Business Associate Agreements
SOC 2      | SaaS/cloud providers  | Trust Service Criteria: Security, Availability, Confidentiality

IT technician responsibilities:
• Enforce access controls per policy
• Apply patches within SLA
• Maintain audit logs
• Report breaches immediately
• Follow data handling procedures`,
    jobTypes: ["Security", "General IT"],
    difficulty: "Intermediate",
    tags: ["compliance", "ISO 27001", "NIST", "PCI-DSS", "GDPR", "HIPAA"]
  },
  {
    id: 75,
    category: "5. IT Security & Compliance",
    subcategory: "Encryption",
    question: "What is the difference between symmetric and asymmetric encryption?",
    answer: `Symmetric Encryption:
• Same key encrypts and decrypts
• Fast, efficient for large data
• Problem: how to securely share the key?
• Algorithms: AES-256 (standard), ChaCha20
• Use: disk encryption (BitLocker), file encryption, VPN data channel

Asymmetric Encryption:
• Key pair: Public key (encrypt) + Private key (decrypt)
• Slower; used for key exchange and digital signatures
• Algorithms: RSA-2048/4096, ECC (ECDSA)
• Use: HTTPS (TLS handshake), SSH, email signing (S/MIME), certificates

In practice: TLS uses asymmetric to exchange a symmetric session key (hybrid approach).
Hashing (not encryption): SHA-256, SHA-3 – one-way, used for integrity (passwords, checksums).`,
    jobTypes: ["Security", "Networking"],
    difficulty: "Intermediate",
    tags: ["encryption", "AES", "RSA", "TLS", "asymmetric", "symmetric"]
  },
  {
    id: 76,
    category: "5. IT Security & Compliance",
    subcategory: "Phishing",
    question: "What is phishing and how do you protect against it?",
    answer: `Phishing = social engineering attack to steal credentials or deliver malware via fake emails/links.

Types:
• Phishing – bulk, generic emails
• Spear phishing – targeted, personalised
• Whaling – targeting executives (CEO, CFO)
• Smishing – via SMS
• Vishing – via phone call

Red flags: urgency, misspelled domains, unexpected attachments, requests for credentials.

Technical controls:
• Email authentication: SPF, DKIM, DMARC (blocks spoofed emails)
• Anti-phishing gateway: Proofpoint, Mimecast, Defender for Office 365
• URL scanning (sandbox links before clicking)
• MFA (credential theft alone insufficient)
• Report phishing button in Outlook

Human controls: regular phishing simulations (KnowBe4, Proofpoint Security Awareness).`,
    jobTypes: ["Security", "IT Support"],
    difficulty: "Beginner",
    tags: ["phishing", "social engineering", "SPF", "DKIM", "DMARC", "email security"]
  },
  {
    id: 77,
    category: "5. IT Security & Compliance",
    subcategory: "Incident Response",
    question: "What are the phases of an incident response plan?",
    answer: `NIST Incident Response Lifecycle:

1. Preparation
   • IR plan, contact lists, SIEM deployed, tools ready, tabletop exercises

2. Detection & Analysis
   • Alerts from SIEM/EDR/user reports → triage → confirm incident
   • Severity classification (P1 Critical → P4 Low)

3. Containment
   • Short-term: isolate affected system, block threat vector
   • Long-term: eradicate while minimising business impact

4. Eradication
   • Remove malware, patch vulnerability, rebuild compromised systems

5. Recovery
   • Restore from clean backup, monitor for reinfection, return to production

6. Lessons Learned (Post-Incident Review)
   • Root cause analysis, update playbooks, retrain users, fix gaps`,
    jobTypes: ["Security"],
    difficulty: "Intermediate",
    tags: ["incident response", "NIST", "SIEM", "containment", "playbook"]
  },
  {
    id: 78,
    category: "5. IT Security & Compliance",
    subcategory: "Firewall",
    question: "How do you create and manage firewall rules effectively?",
    answer: `Firewall rule best practices:

Rule structure: Source IP | Destination IP | Port/Protocol | Action (Allow/Deny)

Order matters: Rules are evaluated top-down, first match wins.

Best practices:
• Least privilege: only open ports that are needed
• Deny all by default (implicit deny at bottom)
• Use named objects/groups (easier to manage)
• Document the business reason for each rule
• Review and audit rules quarterly (remove stale rules)
• Segment traffic: separate VLANs for different security zones
• Log denied traffic for detection
• Egress filtering: also restrict outbound (prevents data exfiltration)`,
    codeSnippet: `! Cisco ACL example – allow HTTP/HTTPS inbound, deny all else
ip access-list extended WAN_IN
 permit tcp any 10.0.0.0 0.0.0.255 eq 80
 permit tcp any 10.0.0.0 0.0.0.255 eq 443
 deny   ip any any log`,
    jobTypes: ["Networking", "Security"],
    difficulty: "Intermediate",
    tags: ["firewall", "ACL", "rules", "deny all", "security policy"]
  },
  {
    id: 79,
    category: "5. IT Security & Compliance",
    subcategory: "BitLocker",
    question: "How do you deploy and manage BitLocker disk encryption?",
    answer: `BitLocker = Windows full-disk encryption using AES-128/256.

Deployment:
1. Ensure TPM 2.0 chip present (or USB key method)
2. Enable via Group Policy or Intune (silent encryption)
3. Choose unlock method: TPM only, TPM+PIN, USB key
4. Backup Recovery Key to AD, Azure AD, or file

Key management via AD:
• Configure GPO to store recovery key in AD before encrypting
• View recovery keys: ADUC → Computer object → BitLocker tab
• Suspend BitLocker before BIOS updates (avoids recovery mode)

PowerShell management:`,
    codeSnippet: `# Check BitLocker status
manage-bde -status C:
Get-BitLockerVolume

# Enable BitLocker with TPM
Enable-BitLocker -MountPoint "C:" -EncryptionMethod Aes256 \`
  -TpmProtector

# Backup recovery key to AD
Backup-BitLockerKeyProtector -MountPoint "C:" -KeyProtectorId (Get-BitLockerVolume C:).KeyProtector[0].KeyProtectorId`,
    jobTypes: ["IT Support", "Security"],
    difficulty: "Intermediate",
    tags: ["BitLocker", "encryption", "TPM", "disk encryption", "Windows"]
  },
  {
    id: 80,
    category: "5. IT Security & Compliance",
    subcategory: "SIEM",
    question: "What is a SIEM and how does it help detect threats?",
    answer: `SIEM (Security Information and Event Management):
• Collects logs from all sources (firewalls, ADs, servers, endpoints, cloud)
• Normalises and correlates events
• Alerts on suspicious patterns (correlation rules)
• Enables forensic investigation

Key capabilities:
• Log aggregation and retention (compliance requirement)
• Real-time alerting on high-fidelity threats
• User and Entity Behaviour Analytics (UEBA)
• Threat Intelligence integration (known malicious IPs/domains)

Popular SIEMs:
• Microsoft Sentinel – cloud-native, AI-powered
• Splunk – market leader, powerful search language (SPL)
• IBM QRadar
• Elastic SIEM (open-source)
• Wazuh (open-source SIEM + XDR)`,
    jobTypes: ["Security"],
    difficulty: "Advanced",
    tags: ["SIEM", "Splunk", "Sentinel", "log management", "threat detection"]
  },
  {
    id: 81,
    category: "5. IT Security & Compliance",
    subcategory: "Password Policy",
    question: "What are modern password policy best practices (NIST 2024)?",
    answer: `NIST SP 800-63B updated guidance (moved away from old complexity rules):

Recommended:
• Minimum 8 characters (12+ recommended for admins)
• Maximum length ≥ 64 characters
• Allow spaces and all printable characters
• Check against breach databases (Have I Been Pwned API)
• Require MFA instead of frequent rotations
• Use passphrases (easier to remember, harder to crack)
• Implement account lockout after failed attempts

Not Recommended (NIST no longer recommends):
• Mandatory periodic rotation (leads to predictable patterns: Password1 → Password2)
• Complexity requirements (uppercase/number/symbol) alone
• Password hints (information leakage)
• Knowledge-based authentication (security questions)

Tools: Entra ID Password Protection blocks common/breach passwords.`,
    jobTypes: ["Security", "IT Support"],
    difficulty: "Intermediate",
    tags: ["password policy", "NIST", "MFA", "passphrase", "security"]
  },
  {
    id: 82,
    category: "5. IT Security & Compliance",
    subcategory: "Endpoint Security",
    question: "What is EDR and how does it differ from traditional antivirus?",
    answer: `Traditional AV:
• Signature-based detection (known malware hashes)
• Poor against fileless malware, zero-days
• Retrospective – detects after damage

EDR (Endpoint Detection & Response):
• Behavioural analysis (detects anomalous activity patterns)
• Memory scanning, process injection detection
• Fileless attack detection
• Threat hunting capability
• Automated response (quarantine, kill process, isolate host)
• Forensic telemetry (what happened before/after)

XDR (Extended DR) = EDR + network + cloud + email telemetry.

Leading EDR products:
• CrowdStrike Falcon (industry leader)
• Microsoft Defender for Endpoint (built-in Windows)
• SentinelOne
• Palo Alto Cortex XDR`,
    jobTypes: ["Security"],
    difficulty: "Advanced",
    tags: ["EDR", "XDR", "CrowdStrike", "antivirus", "endpoint security"]
  },
  {
    id: 83,
    category: "5. IT Security & Compliance",
    subcategory: "Vulnerability Management",
    question: "What is vulnerability management and what tools are used?",
    answer: `Vulnerability Management Lifecycle:
1. Asset Discovery – know what's in your environment
2. Vulnerability Scanning – automated scanning to find CVEs
3. Risk Assessment – CVSS score + exploitability + business impact
4. Prioritisation – patch critical/high first, especially internet-facing
5. Remediation – patch, configuration change, or compensating control
6. Verification – rescan to confirm fix
7. Reporting – track KPIs (mean time to patch, open critical vulns)

Scanning tools:
• Tenable Nessus / Tenable.io – industry standard
• Qualys VMDR
• Rapid7 InsightVM
• OpenVAS (open-source)
• Microsoft Defender Vulnerability Management (built-in)

CVSS v3 Scoring: 0-3.9 Low → 4-6.9 Medium → 7-8.9 High → 9-10 Critical`,
    jobTypes: ["Security"],
    difficulty: "Advanced",
    tags: ["vulnerability management", "CVSS", "Nessus", "patching", "CVE"]
  },
  {
    id: 84,
    category: "5. IT Security & Compliance",
    subcategory: "Social Engineering",
    question: "What are common social engineering attacks and countermeasures?",
    answer: `Social Engineering = manipulating humans to bypass technical controls.

Techniques:
• Pretexting – fabricated scenario (impersonate IT, HR, vendor)
• Baiting – leave USB drives in car park (curiosity attack)
• Quid Pro Quo – offer tech help in exchange for credentials
• Tailgating/Piggybacking – follow employee through secure door
• Vishing – phone call impersonating IT support ("I need to reset your password")
• CEO Fraud – email appearing from exec, requests urgent wire transfer

Countermeasures:
• Security awareness training (KnowBe4, Proofpoint)
• Clear verification procedures (never share credentials to anyone, including IT)
• Visitor management and badge access controls
• Shred sensitive documents
• Report suspicious activity process`,
    jobTypes: ["Security", "IT Support"],
    difficulty: "Intermediate",
    tags: ["social engineering", "pretexting", "phishing", "security awareness"]
  },
  {
    id: 85,
    category: "5. IT Security & Compliance",
    subcategory: "Wireless Security",
    question: "What security risks exist with public Wi-Fi and how do you mitigate them?",
    answer: `Public Wi-Fi risks:
• Evil Twin attack: attacker creates identical SSID to legitimate AP; intercepts all traffic
• Man-in-the-Middle: intercept unencrypted HTTP traffic
• Packet sniffing: capture cleartext data (Wireshark)
• Captive portal credential harvesting

Mitigations for users:
• Always use corporate VPN on public Wi-Fi (encrypts all traffic)
• Only visit HTTPS sites (check padlock)
• Disable auto-connect to open networks
• Use mobile hotspot instead of public Wi-Fi for sensitive work
• Enable firewall on laptop

Mitigations for IT:
• Enforce VPN policy via GPO/Intune for managed devices
• Deploy always-on VPN (Cisco AnyConnect, GlobalProtect)
• Block split-tunnelling to force all traffic via VPN`,
    jobTypes: ["Security", "Networking"],
    difficulty: "Intermediate",
    tags: ["public Wi-Fi", "Evil Twin", "VPN", "HTTPS", "wireless security"]
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. CLOUD & VIRTUALISATION (86 – 95)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 86,
    category: "6. Cloud & Virtualisation",
    subcategory: "Cloud Models",
    question: "What are IaaS, PaaS, and SaaS with real examples?",
    answer: `Cloud service models:

IaaS (Infrastructure as a Service):
• You manage: OS, middleware, apps, data
• Provider manages: hardware, networking, virtualisation
• Examples: AWS EC2, Azure VMs, Google Compute Engine

PaaS (Platform as a Service):
• You manage: apps and data only
• Provider manages: OS, runtime, scaling, infrastructure
• Examples: Azure App Service, Google App Engine, Heroku

SaaS (Software as a Service):
• You just use the app (browser-based)
• Provider manages everything
• Examples: Microsoft 365, Salesforce, Slack, Zoom

Shared Responsibility Model: customer is always responsible for data and identity regardless of model.`,
    jobTypes: ["Cloud", "General IT"],
    difficulty: "Beginner",
    tags: ["IaaS", "PaaS", "SaaS", "cloud", "AWS", "Azure", "shared responsibility"]
  },
  {
    id: 87,
    category: "6. Cloud & Virtualisation",
    subcategory: "Azure",
    question: "What are the core Azure services every IT pro should know?",
    answer: `Core Azure services:
Category     | Service                    | Purpose
Compute      | Azure VM                   | IaaS virtual machines
Compute      | Azure App Service          | PaaS web apps
Compute      | AKS (Kubernetes Service)   | Container orchestration
Storage      | Blob Storage               | Object/unstructured storage
Storage      | Azure Files                | SMB file shares in cloud
Networking   | Azure VNet                 | Private cloud network
Networking   | Azure VPN Gateway          | Site-to-site / P2S VPN
Networking   | Azure Load Balancer        | L4 load balancing
Identity     | Azure AD (Entra ID)        | Cloud identity, SSO
Security     | Microsoft Defender         | CNAPP, threat protection
Monitoring   | Azure Monitor + Log Analytics | Metrics, logs, alerts
Backup       | Azure Backup / Site Recovery | Backup & DR`,
    jobTypes: ["Cloud", "Sysadmin"],
    difficulty: "Intermediate",
    tags: ["Azure", "cloud", "VNet", "Azure AD", "Azure VM", "Microsoft 365"]
  },
  {
    id: 88,
    category: "6. Cloud & Virtualisation",
    subcategory: "AWS",
    question: "What are the essential AWS services for IT infrastructure?",
    answer: `Essential AWS services:
Service     | Purpose
EC2         | Virtual machines (IaaS)
S3          | Object storage (files, backups, static websites)
RDS         | Managed relational databases (MySQL, PostgreSQL, SQL Server)
VPC         | Private network in AWS cloud
IAM         | Identity and access management
CloudWatch  | Monitoring, metrics, alarms, logs
Route 53    | DNS service
ELB         | Elastic Load Balancer (ALB, NLB, CLB)
CloudTrail  | API audit logging (who did what)
Lambda      | Serverless compute (functions-as-a-service)
Direct Connect | Dedicated private link from on-prem to AWS

AWS Well-Architected Pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability.`,
    jobTypes: ["Cloud"],
    difficulty: "Intermediate",
    tags: ["AWS", "EC2", "S3", "VPC", "IAM", "CloudWatch", "cloud"]
  },
  {
    id: 89,
    category: "6. Cloud & Virtualisation",
    subcategory: "Microsoft 365",
    question: "What does a Microsoft 365 administrator manage?",
    answer: `Microsoft 365 (M365) admin responsibilities:

User & Licensing:
• Create/manage users, assign licenses
• Set up MFA and Conditional Access (Azure AD)
• Manage groups (Security, Distribution, Microsoft 365 groups)

Exchange Online:
• Mailbox management, shared mailboxes, distribution lists
• Anti-spam, anti-phishing (Defender for Office 365)
• Email flow rules, connectors

SharePoint / OneDrive:
• Site collection management, permissions
• External sharing policies, DLP

Teams:
• Teams/channel policies, guest access
• Meeting policies, phone system (if licensed)

Security & Compliance:
• Data Loss Prevention (DLP) policies
• Microsoft Purview (compliance/eDiscovery)
• Audit log review`,
    jobTypes: ["Sysadmin", "IT Support", "Cloud"],
    difficulty: "Intermediate",
    tags: ["Microsoft 365", "Exchange Online", "SharePoint", "Teams", "admin"]
  },
  {
    id: 90,
    category: "6. Cloud & Virtualisation",
    subcategory: "Backup",
    question: "What cloud backup solutions are available and how do you choose?",
    answer: `Cloud Backup options:
Solution              | Best For
Azure Backup          | Azure VMs, on-prem Windows servers, SQL
AWS Backup            | Centralised AWS resource backup
Veeam Backup & Replication | Hybrid (VMware/Hyper-V/cloud)
Acronis Cyber Backup  | SMB all-in-one backup
Backblaze B2          | Cost-effective cloud storage target
Zerto                 | Continuous replication, RPO in seconds

Selection criteria:
• RPO/RTO requirements
• Data volume and retention period
• Regulatory compliance (GDPR data sovereignty)
• Cost (storage + egress fees)
• Encryption in transit + at rest
• Immutable backups (ransomware protection)
• Restore testing capability`,
    jobTypes: ["Sysadmin", "Cloud"],
    difficulty: "Intermediate",
    tags: ["cloud backup", "Azure Backup", "Veeam", "Acronis", "disaster recovery"]
  },
  {
    id: 91,
    category: "6. Cloud & Virtualisation",
    subcategory: "Containers",
    question: "What is Docker and how does it differ from virtualisation?",
    answer: `Docker = containerisation platform.

VM vs Container:
• VM: full OS + hypervisor layer, isolated, heavy (~GBs)
• Container: shares host OS kernel, lightweight (~MBs), starts in seconds

Docker components:
• Image – read-only template (like a class)
• Container – running instance of an image (like an object)
• Dockerfile – instructions to build an image
• Registry – store images (Docker Hub, ECR, ACR)
• Docker Compose – define multi-container apps`,
    codeSnippet: `# Pull and run nginx container
docker pull nginx
docker run -d -p 80:80 --name webserver nginx

# Build from Dockerfile
docker build -t myapp:1.0 .

# List containers
docker ps -a

# Stop and remove
docker stop webserver && docker rm webserver`,
    jobTypes: ["Cloud", "Sysadmin"],
    difficulty: "Intermediate",
    tags: ["Docker", "containers", "virtualisation", "DevOps", "microservices"]
  },
  {
    id: 92,
    category: "6. Cloud & Virtualisation",
    subcategory: "Intune",
    question: "How do you deploy applications using Microsoft Intune?",
    answer: `Intune app deployment types:
• Win32 app – .exe/.msi packaged in .intunewin using IntuneWinAppUtil.exe
• Microsoft Store app – deploy from business store
• LOB app – custom internal .msi/.apk
• Web app – add a link to web app
• Microsoft 365 Apps – deploy Office suite

Deployment groups:
• Available – user can install from Company Portal
• Required – mandatory, pushed automatically
• Uninstall – remove app remotely

Win32 deployment:
1. Package with IntuneWinAppUtil.exe
2. Upload to Intune → specify install/uninstall command, detection rule
3. Assign to Azure AD group`,
    codeSnippet: `# Package Win32 app
IntuneWinAppUtil.exe -c "C:\\AppSource" -s "setup.exe" -o "C:\\Output"

# Detection rule example (registry)
# Key: HKLM\\SOFTWARE\\MyApp
# Value: Version = 1.0.0`,
    jobTypes: ["Sysadmin", "IT Support"],
    difficulty: "Intermediate",
    tags: ["Intune", "MDM", "app deployment", "Win32", "Microsoft Endpoint Manager"]
  },
  {
    id: 93,
    category: "6. Cloud & Virtualisation",
    subcategory: "Cost Management",
    question: "How do you optimise and control cloud costs?",
    answer: `Cloud cost optimisation strategies:

Right-sizing:
• Analyse CPU/RAM utilisation → downsize over-provisioned VMs
• AWS Compute Optimizer, Azure Advisor recommendations

Reserved Instances / Savings Plans:
• Commit 1-3 years → save 30-70% vs on-demand
• Use for predictable workloads

Auto-scaling:
• Scale out when load increases, scale in when low
• Pay only for what you use

Storage:
• Use tiered storage (hot/cool/archive) based on access frequency
• Delete unattached disks, old snapshots

Governance:
• Tagging strategy (team, project, cost centre)
• Budget alerts and spending limits
• Reserved unused resources review`,
    jobTypes: ["Cloud"],
    difficulty: "Intermediate",
    tags: ["cloud cost", "FinOps", "reserved instances", "auto-scaling", "AWS", "Azure"]
  },
  {
    id: 94,
    category: "6. Cloud & Virtualisation",
    subcategory: "Networking",
    question: "What is a VNet peering and how do Azure VNets connect?",
    answer: `Azure Virtual Network (VNet) = isolated private network in Azure.

Connectivity options:
• VNet Peering – direct, low-latency connection between VNets (same or different regions)
  → Private IP routing, traffic stays on Microsoft backbone
  → Non-transitive (A↔B and B↔C doesn't mean A↔C – use hub-spoke)
• VPN Gateway – encrypted tunnel over internet to on-prem or other VNets
• ExpressRoute – private dedicated circuit from on-prem to Azure (no internet)
• Azure Virtual WAN – managed hub connecting multiple sites and VNets

Hub-Spoke topology:
• Hub VNet contains shared services (firewall, VPN, DNS)
• Spoke VNets peer to hub for controlled access`,
    jobTypes: ["Cloud", "Networking"],
    difficulty: "Advanced",
    tags: ["Azure VNet", "VNet peering", "ExpressRoute", "hub-spoke", "networking"]
  },
  {
    id: 95,
    category: "6. Cloud & Virtualisation",
    subcategory: "Automation",
    question: "What is Infrastructure as Code (IaC) and why is it important?",
    answer: `IaC = managing and provisioning infrastructure through code/config files (not manual UI/CLI).

Benefits:
• Consistency – eliminates configuration drift
• Version control – track all infrastructure changes in Git
• Repeatability – identical environments (dev/staging/prod)
• Speed – provision entire environment in minutes
• Documentation – code is the documentation

Tools:
• Terraform – cloud-agnostic, declarative HCL language (most popular)
• Azure Bicep / ARM Templates – Azure-native IaC
• AWS CloudFormation – AWS-native
• Ansible – agentless configuration management (YAML playbooks)
• Puppet / Chef – traditional config management`,
    codeSnippet: `# Terraform – create Azure Resource Group + VM
resource "azurerm_resource_group" "main" {
  name     = "rg-prod-eastus"
  location = "East US"
}

terraform init
terraform plan    # preview changes
terraform apply   # deploy infrastructure`,
    jobTypes: ["Cloud", "Sysadmin"],
    difficulty: "Advanced",
    tags: ["IaC", "Terraform", "Ansible", "Bicep", "CloudFormation", "DevOps"]
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. CERTIFICATIONS & STUDY GUIDE (96 – 105)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 96,
    category: "7. Certifications & Study Guide",
    subcategory: "CompTIA A+",
    question: "What does the CompTIA A+ certification cover and who is it for?",
    answer: `CompTIA A+ (Core 1: 220-1101 + Core 2: 220-1102) is the entry-level IT certification.

Core 1 covers:
• Mobile devices (smartphones, tablets)
• Networking (TCP/IP, Wi-Fi, ports)
• Hardware (RAM, storage, CPUs, printers)
• Virtualisation and cloud basics
• Hardware troubleshooting

Core 2 covers:
• Windows OS (installation, configuration, troubleshooting)
• Security (malware removal, physical security, social engineering)
• Software troubleshooting
• Operational procedures (safety, environmental, communication)

Best for: Entry-level help desk, desktop support, field technician roles.
Exam format: 90 questions max, 90 minutes, 675/900 passing score.
Recommended study: CompTIA official guide, Professor Messer (free), Jason Dion (Udemy).`,
    jobTypes: ["IT Support", "General IT"],
    difficulty: "Beginner",
    tags: ["CompTIA A+", "certification", "help desk", "IT support", "exam"]
  },
  {
    id: 97,
    category: "7. Certifications & Study Guide",
    subcategory: "CompTIA Network+",
    question: "What does CompTIA Network+ cover and what are key exam topics?",
    answer: `CompTIA Network+ (N10-008) – network technician certification.

Key exam domains:
1. Networking Fundamentals (24%) – OSI, topologies, cables, ports
2. Network Implementations (19%) – routing, switching, wireless, VLANs
3. Network Operations (16%) – monitoring, SNMP, documentation, policies
4. Network Security (19%) – firewalls, VPN, IDS/IPS, network hardening
5. Network Troubleshooting (22%) – tools, common problems, methodology

Key topics you must master:
• Subnetting and CIDR notation
• OSI model layers with examples
• VLAN configuration concepts
• Routing protocols (OSPF, BGP overview)
• Wireless standards (802.11 a/b/g/n/ac/ax) and security (WPA2/WPA3)
• Common ports and protocols
• Network troubleshooting tools

Recommend: Professor Messer N+ course (free on YouTube), CompTIA study guide.`,
    jobTypes: ["Networking", "IT Support"],
    difficulty: "Intermediate",
    tags: ["CompTIA Network+", "certification", "networking", "exam prep"]
  },
  {
    id: 98,
    category: "7. Certifications & Study Guide",
    subcategory: "CompTIA Security+",
    question: "What are the key Security+ exam domains and why is it important?",
    answer: `CompTIA Security+ (SY0-701) – baseline cybersecurity certification.

Exam domains:
1. General Security Concepts (12%) – CIA triad, cryptography, security controls
2. Threats, Vulnerabilities & Mitigations (22%) – malware, social engineering, vulnerability scanning
3. Security Architecture (18%) – cloud, network, enterprise security design
4. Security Operations (28%) – IAM, endpoint security, incident response
5. Security Program Management (20%) – governance, compliance, risk management

Why important:
• DoD 8570 requirement for US government/contractor work
• Vendor-neutral baseline respected worldwide
• Prerequisite for higher certs (CASP+, CEH, CISSP path)

Key concepts to master: CIA Triad, Defence in Depth, Zero Trust, MFA, encryption types, IR lifecycle.`,
    jobTypes: ["Security", "IT Support"],
    difficulty: "Intermediate",
    tags: ["Security+", "CompTIA", "cybersecurity", "certification", "exam"]
  },
  {
    id: 99,
    category: "7. Certifications & Study Guide",
    subcategory: "CCNA",
    question: "What does the Cisco CCNA cover and how do you prepare for it?",
    answer: `CCNA (200-301) – Cisco Certified Network Associate.

Exam topics:
• Network fundamentals (OSI, TCP/IP, cabling) – 20%
• Network access (VLANs, STP, EtherChannel, wireless) – 20%
• IP connectivity (routing, OSPF, static routes) – 25%
• IP services (DHCP, DNS, NAT, SNMP, QoS) – 10%
• Security fundamentals (AAA, ACLs, VPN, firewalls) – 15%
• Automation (Ansible, REST APIs, JSON, SDN) – 10%

Preparation:
• Cisco Learning Network (official): learningnetwork.cisco.com
• Jeremy's IT Lab (free YouTube course – highly rated)
• Packet Tracer / GNS3 for lab practice
• Neil Anderson (Udemy)

Duration: 120 minutes, ~100 questions. Passing: 825/1000.`,
    jobTypes: ["Networking"],
    difficulty: "Advanced",
    tags: ["CCNA", "Cisco", "networking", "certification", "routing", "switching"]
  },
  {
    id: 100,
    category: "7. Certifications & Study Guide",
    subcategory: "ITIL",
    question: "What is ITIL v4 and what are its core concepts?",
    answer: `ITIL v4 (IT Infrastructure Library) is the global framework for IT service management (ITSM).

Service Value System (SVS): how all components work together to create value.

4 Dimensions of Service Management:
1. Organisations & People
2. Information & Technology
3. Partners & Suppliers
4. Value Streams & Processes

Key Practices (formerly processes):
• Incident Management – restore service ASAP
• Problem Management – find root cause, prevent recurrence
• Change Enablement – control changes to minimise risk
• Service Desk – single point of contact for users
• Asset Management – track IT assets
• Service Level Management – define and measure SLAs

ITIL 4 Foundation exam: 40 questions, 65% pass mark, 60 minutes.`,
    jobTypes: ["IT Support", "Sysadmin"],
    difficulty: "Intermediate",
    tags: ["ITIL v4", "ITSM", "service management", "SLA", "certification"]
  },
  {
    id: 101,
    category: "7. Certifications & Study Guide",
    subcategory: "CISSP",
    question: "What is the CISSP certification and what domains does it cover?",
    answer: `CISSP (Certified Information Systems Security Professional) – elite security certification by ISC².

Requires 5 years of paid work experience in 2+ domains.

8 CISSP Domains:
1. Security & Risk Management (15%) – policies, ethics, risk, compliance
2. Asset Security (10%) – data classification, ownership, privacy
3. Security Architecture (13%) – security models, encryption, design principles
4. Communication & Network Security (13%) – protocols, VPN, firewall, wireless
5. Identity & Access Management (13%) – AAA, MFA, PKI, federation
6. Security Assessment & Testing (12%) – audit, penetration testing, vulnerability
7. Security Operations (13%) – IR, BCP/DR, forensics, monitoring
8. Software Development Security (11%) – SDLC, OWASP, DevSecOps

Exam: 100-150 questions (adaptive), 3 hours, 700/1000 passing.`,
    jobTypes: ["Security"],
    difficulty: "Expert",
    tags: ["CISSP", "ISC2", "security", "certification", "advanced"]
  },
  {
    id: 102,
    category: "7. Certifications & Study Guide",
    subcategory: "CEH",
    question: "What is the CEH certification and what skills does it validate?",
    answer: `CEH (Certified Ethical Hacker) by EC-Council validates penetration testing and offensive security skills.

Key topics:
• Footprinting & Reconnaissance (passive/active)
• Scanning Networks (Nmap, Masscan)
• Enumeration (SMB, SNMP, LDAP)
• Vulnerability Analysis (Nessus, OpenVAS)
• System Hacking (privilege escalation, password cracking)
• Malware Threats (trojans, viruses, ransomware)
• Social Engineering
• Web Application Hacking (OWASP Top 10)
• Session Hijacking
• Evading IDS/IPS/Firewalls
• Cloud Hacking
• Cryptography

Practical CEH exam includes 6-hour hands-on assessment.
Alternative: OSCP (Offensive Security) – more practical, harder, higher industry recognition.`,
    jobTypes: ["Security"],
    difficulty: "Advanced",
    tags: ["CEH", "ethical hacking", "penetration testing", "EC-Council", "security"]
  },
  {
    id: 103,
    category: "7. Certifications & Study Guide",
    subcategory: "Study Tips",
    question: "What is the recommended IT certification path for a career in IT Support/Networking?",
    answer: `Recommended certification roadmap:

Entry Level (0-2 years experience):
→ CompTIA IT Fundamentals (ITF+) [optional starter]
→ CompTIA A+ [helpdesk, desktop support]
→ ITIL 4 Foundation [service management mindset]

Mid Level (2-4 years):
→ CompTIA Network+ [networking roles]
→ CompTIA Security+ [security awareness for all IT roles]
→ Microsoft MS-900 (M365 Fundamentals) → MD-102 (Endpoint Admin)
→ CCNA [network engineer track]

Advanced Level (4+ years):
→ CCNP Enterprise / Cisco Specialist [senior networking]
→ AWS Solutions Architect / Azure Administrator (AZ-104)
→ CISSP [senior security roles, 5yr experience required]
→ CEH / OSCP [penetration tester track]

Tips: Lab practice > just studying. Use GNS3, Packet Tracer, Azure free tier, TryHackMe for hands-on.`,
    jobTypes: ["IT Support", "Networking", "Security", "General IT"],
    difficulty: "Beginner",
    tags: ["career path", "certifications", "A+", "CCNA", "Security+", "roadmap"]
  },
  {
    id: 104,
    category: "7. Certifications & Study Guide",
    subcategory: "Azure Certs",
    question: "What are the key Microsoft Azure certifications?",
    answer: `Microsoft Azure certification tracks:

Fundamentals:
• AZ-900 – Azure Fundamentals (no experience required)
• MS-900 – Microsoft 365 Fundamentals
• SC-900 – Security, Compliance & Identity Fundamentals

Associate:
• AZ-104 – Azure Administrator (manage VMs, networking, storage, AD)
• AZ-204 – Azure Developer
• AZ-500 – Azure Security Engineer
• MD-102 – Endpoint Administrator (Intune, Autopilot)
• SC-200 – Security Operations Analyst (Microsoft Sentinel, Defender)

Expert:
• AZ-305 – Azure Solutions Architect Expert
• AZ-400 – DevOps Engineer Expert

Study resources: Microsoft Learn (free, official), John Savill (YouTube – excellent AZ-104/305), Whizlabs (practice exams).`,
    jobTypes: ["Cloud", "Sysadmin"],
    difficulty: "Intermediate",
    tags: ["Azure", "Microsoft", "AZ-104", "AZ-500", "certification", "cloud"]
  },
  {
    id: 105,
    category: "7. Certifications & Study Guide",
    subcategory: "Exam Tips",
    question: "What are practical exam tips for CompTIA and Cisco certification exams?",
    answer: `General exam tips:

Before the exam:
• Schedule exam to create a deadline (motivation)
• Use multiple resources: book + video + practice tests
• Lab practice is essential (don't just read theory)
• Take practice exams under timed conditions
• Focus on weak areas from practice test results

During the exam:
• Read questions fully – look for key words: "BEST", "MOST", "FIRST", "LEAST"
• Eliminate wrong answers first (process of elimination)
• Flag difficult questions, come back at end
• Don't overthink – trust your preparation
• For performance-based questions (PBT): attempt them early

CompTIA specific:
• Know port numbers (21, 22, 25, 53, 80, 443, 3389 etc.)
• OSI model layers with examples
• Troubleshooting methodology steps in order

Cisco specific:
• Practice CLI commands in Packet Tracer daily
• Understand, don't memorise – exam tests application`,
    jobTypes: ["IT Support", "Networking", "Security", "General IT"],
    difficulty: "Beginner",
    tags: ["exam tips", "CompTIA", "Cisco", "CCNA", "study strategy"]
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. REAL-WORLD SUPPORT SCENARIOS (106 – 120)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 106,
    category: "8. Real-World Support Scenarios",
    subcategory: "Outage",
    question: "The entire office has lost internet. What do you do?",
    answer: `P1 Major Incident response:

Immediate triage (< 5 min):
1. Confirm it's not just one user (ping multiple workstations to test LAN)
2. Check ISP modem/router – are the WAN lights normal?
3. Check core switch/firewall – power, LEDs, console access
4. Log into firewall – is WAN interface up? Any BGP/routing alerts?
5. Check ISP status page / call ISP (get incident number)

Parallel actions:
• Notify management (send email from phone, not LAN)
• Activate failover (secondary ISP or 4G/LTE router if available)
• Post status update to users (Teams/Slack/email via mobile)

Escalation:
• If firewall issue: Tier 3 / vendor TAC support
• If ISP fault: escalate to ISP priority queue (P1 SLA)

Document every action with timestamps.`,
    jobTypes: ["IT Support", "Networking"],
    difficulty: "Advanced",
    tags: ["outage", "incident management", "P1", "ISP", "troubleshooting"]
  },
  {
    id: 107,
    category: "8. Real-World Support Scenarios",
    subcategory: "Password",
    question: "A senior manager can't log in to their laptop 5 minutes before a board meeting. What do you do?",
    answer: `Priority: VIP user, time-critical.

Immediate options (assess quickly):
1. Try PIN login (Windows Hello) if password reset was recent
2. Check if account is locked out: check AD from your PC → Unlock immediately
3. Reset AD password from your PC → user tries new password
4. If laptop offline (not connected to domain): cached credentials may not update → connect to network first, then try

If still can't log in:
• Offer your laptop / device for the meeting (higher priority than fixing)
• Set up guest profile quickly if possible
• Remote desktop from a known-good device

After meeting:
• Investigate root cause (expired password, account locked, profile corruption)
• Document and follow up with user

Always stay calm and communicate clearly with the VIP.`,
    jobTypes: ["IT Support"],
    difficulty: "Intermediate",
    tags: ["VIP support", "password", "Active Directory", "escalation", "scenario"]
  },
  {
    id: 108,
    category: "8. Real-World Support Scenarios",
    subcategory: "DHCP",
    question: "Multiple users in one floor suddenly get 169.254.x.x IP addresses. What happened?",
    answer: `169.254.x.x = APIPA – client couldn't get DHCP response.

Root cause possibilities:
1. DHCP scope exhausted (all IPs leased out) – most common
2. DHCP server down / Windows Server rebooted
3. Network connectivity to DHCP server lost (trunk issue, STP change)
4. DHCP relay agent (IP helper) misconfigured on router/switch
5. Rogue DHCP server conflict (another device broadcasting DHCP)

Diagnostics:
• ipconfig /all on affected PC → check DHCP server field
• Check DHCP server: Server Manager → DHCP → Scope stats → check available addresses
• Check Event Viewer on DHCP server for errors
• Wireshark: capture DHCP Discover → see if Offer is returned

Fix: Expand DHCP scope / reduce lease time / restart DHCP server service.`,
    codeSnippet: `# Force DHCP renewal on affected PC
ipconfig /release
ipconfig /renew

# Check DHCP scope (on server)
Get-DhcpServerv4ScopeStatistics -ScopeId 192.168.1.0`,
    jobTypes: ["Networking", "IT Support"],
    difficulty: "Intermediate",
    tags: ["DHCP", "APIPA", "169.254", "troubleshooting", "scope exhaustion"]
  },
  {
    id: 109,
    category: "8. Real-World Support Scenarios",
    subcategory: "Active Directory",
    question: "Users can't log in to domain computers after a DC reboot. What do you check?",
    answer: `Domain authentication failure post-DC reboot:

Check list:
1. DNS – is DC's DNS service started? (Kerberos relies on DNS SRV records)
   • nslookup _ldap._tcp.domain.com → must resolve to DC IP
2. Active Directory Domain Services – is the AD DS service running on DC?
3. Netlogon service – required for authentication; check it's running
4. Kerberos time sync – Kerberos fails if time difference > 5 min between DC and client
5. Check if SYSVOL share is accessible: \\\\DC01\\SYSVOL
6. FSMO roles – check PDC Emulator is online (handles authentication for most scenarios)
7. Firewall on DC – ensure ports 88 (Kerberos), 389 (LDAP), 445 (SMB) are open

Commands:`,
    codeSnippet: `# Test DC connectivity
nltest /sc_verify:domain.com
nltest /dsgetdc:domain.com

# Check FSMO roles
netdom query fsmo

# Check critical services on DC
Get-Service adws, kdc, netlogon, dns | Select Name, Status`,
    jobTypes: ["Sysadmin"],
    difficulty: "Advanced",
    tags: ["Active Directory", "Kerberos", "DNS", "FSMO", "login failure"]
  },
  {
    id: 110,
    category: "8. Real-World Support Scenarios",
    subcategory: "Network",
    question: "A new switch was added and now there are connectivity issues. What is likely the cause?",
    answer: `Most common culprits with new switch addition:

1. STP Topology Change – new switch causes reconvergence; ports enter blocking state
   • Check for Topology Change Notifications (TCN) in switch logs
   • Verify PortFast is configured on access ports
   • Check Root Bridge hasn't changed unexpectedly

2. VLAN Trunk misconfiguration – trunk not allowing required VLANs
   • show interfaces trunk → check allowed VLANs and native VLAN match

3. Duplex/Speed mismatch – auto-negotiation failure causing errors
   • show interfaces → check input/output errors, collisions

4. Cable issue – bad SFP, wrong cable type
   • show interfaces → check line protocol (up/down)

5. Spanning Tree BPDU storm – new switch may be elected as Root Bridge if priority lower than intended`,
    codeSnippet: `! Cisco – verify trunk and STP
show interfaces trunk
show spanning-tree
show spanning-tree detail | include Root|Bridge|Port
show interfaces GigabitEthernet0/1 counters errors`,
    jobTypes: ["Networking"],
    difficulty: "Advanced",
    tags: ["switch", "STP", "VLAN", "trunk", "connectivity", "troubleshooting"]
  },
  {
    id: 111,
    category: "8. Real-World Support Scenarios",
    subcategory: "Email",
    question: "All incoming emails are being rejected. How do you troubleshoot mail flow?",
    answer: `Mail flow troubleshooting:

1. MX record check: nslookup -type=MX domain.com → points to correct mail server?
2. Mail server reachability: telnet mail.domain.com 25 (test SMTP externally)
3. SPF, DKIM, DMARC records correct? → MXToolbox.com
4. Check email gateway (Exchange/M365) message trace:
   • Exchange Admin Center → Mail Flow → Message Trace
5. Anti-spam lists: is the sending IP on an RBL? → MXToolbox Blacklist Check
6. Certificate issues: expired SMTP TLS cert causing TLS failures
7. Connector issues: check inbound connectors (if on-prem/hybrid)
8. DNS propagation: if MX just changed, allow 24-48h TTL

In Microsoft 365:
• Exchange Admin Center → Message Trace → search all messages from outside`,
    codeSnippet: `# Test MX record
nslookup -type=MX contoso.com

# Test SMTP externally (telnet)
telnet mail.contoso.com 25
# If port 25 responds, server is reachable

# M365 PowerShell – message trace
Get-MessageTrace -SenderAddress sender@external.com -StartDate (Get-Date).AddDays(-1)`,
    jobTypes: ["Sysadmin", "IT Support"],
    difficulty: "Advanced",
    tags: ["email", "MX record", "SMTP", "SPF", "DKIM", "Microsoft 365", "mail flow"]
  },
  {
    id: 112,
    category: "8. Real-World Support Scenarios",
    subcategory: "Security",
    question: "You find a suspicious USB drive plugged into a workstation. What do you do?",
    answer: `USB security incident procedure:

Immediate:
1. DO NOT open/run any files on the device
2. DO NOT remove it yet (preserve evidence if formal investigation needed)
3. Isolate the workstation from network (unplug cable / disable Wi-Fi)
4. Note exact time, username, physical location

Investigation:
• Run full EDR/antivirus scan from ANOTHER clean device if possible
• Check Windows Security Event Log (Event ID 4663 – object access) for USB activity
• Check if any files were copied to/from the device

Escalation:
• Notify security team / CISO immediately
• Preserve chain of custody (document who touched it, when)
• If malware found: full IR process (contain, eradicate, recover)

Prevention:
• GPO/Intune: block USB mass storage devices or require approval
• USB whitelisting by vendor ID`,
    jobTypes: ["Security", "IT Support"],
    difficulty: "Intermediate",
    tags: ["USB security", "incident response", "physical security", "malware"]
  },
  {
    id: 113,
    category: "8. Real-World Support Scenarios",
    subcategory: "Performance",
    question: "The file server is extremely slow for all users. How do you diagnose?",
    answer: `File server performance troubleshooting:

Server-side checks:
1. Task Manager / Resource Monitor – CPU, RAM, Disk queue (Disk I/O wait > 0.1ms alert)
2. Performance Monitor – Physical Disk → Avg. Disk Queue Length (> 2 = problem)
3. Check RAID status – degraded RAID causes massive performance drop
4. Network: check server NIC saturation (is 1GbE port at 100%?)
5. Check for antivirus scanning file shares (causes high disk I/O)

Network-side:
• Check for broadcast storms or high switch port utilisation
• Run iperf3 between client and server to test raw throughput

SMB-specific:
• SMB Multichannel: multiple NIC paths used (requires compatible clients)
• Check SMB OpLock issues (file locking)

Quick wins: restart Windows Search indexing if IO spike, exclude share path from AV scanning.`,
    codeSnippet: `# Check disk performance counters
Get-Counter "\\PhysicalDisk(*)\\Avg. Disk Queue Length"
Get-Counter "\\PhysicalDisk(*)\\Disk Bytes/sec"

# Check network throughput
iperf3 -s               # on server
iperf3 -c SERVER_IP     # on client`,
    jobTypes: ["Sysadmin"],
    difficulty: "Advanced",
    tags: ["file server", "performance", "SMB", "disk queue", "RAID", "troubleshooting"]
  },
  {
    id: 114,
    category: "8. Real-World Support Scenarios",
    subcategory: "Azure",
    question: "An Azure VM is unreachable after you changed its NSG. What do you check?",
    answer: `Azure VM connectivity troubleshooting after NSG change:

1. NSG Rules review:
   • Check Inbound rules – is required port (RDP 3389, SSH 22) allowed from your source IP?
   • NSG precedence: lower number = higher priority; check no deny rule blocks it
   • NSG can be attached to subnet AND NIC – both must allow traffic

2. Use Network Watcher:
   • IP Flow Verify: test if traffic is allowed/blocked by NSG
   • NSG Diagnostics: shows which rule is affecting traffic

3. Check if VM is running: Azure Portal → VM → Overview → Status = Running

4. Check Windows Firewall inside VM (if OS-level firewall enabled)

5. Check if RDP is enabled: Run command in portal → "netsh advfirewall firewall show rule name='Remote Desktop'"

6. Check Azure Bastion as alternative access if all else fails`,
    jobTypes: ["Cloud"],
    difficulty: "Intermediate",
    tags: ["Azure", "NSG", "VM", "connectivity", "Network Watcher", "troubleshooting"]
  },
  {
    id: 115,
    category: "8. Real-World Support Scenarios",
    subcategory: "Interview",
    question: "Describe a time you resolved a complex technical issue. (Behavioural interview answer framework)",
    answer: `Use the STAR method for behavioural IT interview questions:

S – Situation: Set the context
"In my previous role at [Company], we experienced a major outage affecting 200+ users during peak business hours."

T – Task: Your responsibility
"As the senior IT technician, I was responsible for identifying the root cause and restoring service within our 2-hour RTO."

A – Action: What you specifically did
"I immediately isolated the issue to the core switch by reviewing logs. I discovered a misconfigured STP change after network maintenance the night before. I reverted the STP configuration, verified all VLANs were passing, and coordinated with the helpdesk to advise users."

R – Result: Quantified outcome
"Service was restored in 45 minutes (within RTO). I then updated the change management procedure to include mandatory STP validation after network changes, preventing recurrence."

Key tips: be specific, quantify impact, show ownership, demonstrate learning.`,
    jobTypes: ["IT Support", "Networking", "Sysadmin"],
    difficulty: "Beginner",
    tags: ["interview", "STAR method", "behavioural", "communication", "soft skills"]
  },
  {
    id: 116,
    category: "8. Real-World Support Scenarios",
    subcategory: "Change Management",
    question: "What is change management and what are standard change types?",
    answer: `Change Management (ITIL) controls how changes are assessed, approved, and implemented to minimise risk.

Change Types:
1. Standard Change – pre-approved, low risk, follows documented procedure
   (e.g. password reset, add user to group)

2. Normal Change – requires CAB review and approval
   (e.g. firewall rule change, server upgrade)
   Steps: RFC → Impact assessment → CAB approval → Implementation → Review

3. Emergency Change – urgent fix for major incident, reduced approval process
   (e.g. critical security patch for active exploit)
   → Still must be documented and reviewed post-implementation

Change Advisory Board (CAB): reviews normal changes, assesses risk, approves/rejects.

Key rule: Never implement changes during freeze windows (peak business periods, year-end).`,
    jobTypes: ["IT Support", "Sysadmin"],
    difficulty: "Intermediate",
    tags: ["change management", "ITIL", "CAB", "RFC", "standard change"]
  },
  {
    id: 117,
    category: "8. Real-World Support Scenarios",
    subcategory: "Scenario",
    question: "Walk me through setting up a new employee's workstation from scratch.",
    answer: `New user workstation setup checklist:

Hardware:
[ ] Verify hardware meets spec (RAM, SSD, model)
[ ] Check physical condition (ports, keyboard, screen)

OS & Domain:
[ ] Confirm OS is up to date (or image/Autopilot enrol)
[ ] Join to domain / Azure AD join
[ ] Apply Group Policy (gpupdate /force)
[ ] Install required software (Office 365, VPN client, etc.)

Account Setup:
[ ] Create AD user account (name, OU, groups)
[ ] Assign Microsoft 365 license
[ ] Set up MFA on Microsoft Authenticator app
[ ] Configure email profile in Outlook (auto Autodiscover)
[ ] Map network drives via login script or GPO

Security:
☐ Enable BitLocker, save recovery key to AD/Intune
☐ Verify antivirus/EDR registered and reporting
☐ Confirm VPN client configured and tested

Handover:
☐ Basic orientation: VPN, helpdesk number, password policy
☐ Asset register updated (serial, make, model, user, date)
☐ Ticket closed with handover confirmation`,
    jobTypes: ["IT Support"],
    difficulty: "Beginner",
    tags: ["new user setup", "onboarding", "workstation", "AD", "Microsoft 365"]
  },
  {
    id: 118,
    category: "8. Real-World Support Scenarios",
    subcategory: "Wireless",
    question: "Users are complaining that Wi-Fi is slow only in one area of the office. What do you investigate?",
    answer: `Localised Wi-Fi performance issues:

Site Survey:
1. Use Wi-Fi analyser app (NetSpot, Acrylic) to check signal strength (RSSI) and channel utilisation in the problem area
2. RSSI should be > -70 dBm for good performance

Common causes:
• Dead zone – AP coverage gap (AP too far, obstructions like walls/elevator shaft)
• Co-channel interference – neighbouring APs or rogue devices on same channel (2.4GHz: use 1, 6, 11; 5GHz: non-overlapping channels)
• AP overloaded – too many clients on single AP → add additional AP or enable band steering
• Building material – concrete, metal, glass cause signal attenuation
• Interference – microwave ovens, Bluetooth, DECT phones on 2.4GHz

Fix options:
• Reposition or add access point
• Change Wi-Fi channels (avoid auto if congested)
• Enable 5GHz SSID and encourage migration (less congested)
• Upgrade to Wi-Fi 6 (OFDMA handles dense deployments better)`,
    jobTypes: ["Networking", "IT Support"],
    difficulty: "Intermediate",
    tags: ["Wi-Fi", "wireless troubleshooting", "RSSI", "interference", "AP", "site survey"]
  },
  {
    id: 119,
    category: "8. Real-World Support Scenarios",
    subcategory: "Scenario",
    question: "How do you handle a situation where you don't know the answer to a user's technical question?",
    answer: `Handling knowledge gaps professionally:

✅ DO:
• Be honest: "That's a great question. I want to make sure I give you the right answer – let me look into it and get back to you."
• Set a timeframe: "I'll have an answer for you within the hour."
• Use available resources: internal KB, vendor docs, Microsoft Docs, community forums, colleagues
• Escalate appropriately if beyond your scope
• Follow up – always deliver on your promise

❌ DON'T:
• Guess or bluff (can cause more damage if wrong)
• Leave the user without a response
• Feel embarrassed – nobody knows everything

Professional mindset:
• IT is a lifelong learning field – knowing your limits is a strength
• Documenting new solutions creates knowledge base articles for future use
• Ask senior colleagues or vendors – that's what they're there for`,
    jobTypes: ["IT Support", "General IT"],
    difficulty: "Beginner",
    tags: ["soft skills", "communication", "knowledge gap", "professionalism", "interview"]
  },
  {
    id: 120,
    category: "8. Real-World Support Scenarios",
    subcategory: "Scenario",
    question: "Your organisation is migrating from on-prem Exchange to Exchange Online (Microsoft 365). What are the key steps?",
    answer: `Exchange Online Migration process:

Pre-migration:
☐ Inventory: mailbox sizes, shared mailboxes, distribution lists, public folders
☐ Clean up: remove stale accounts, archive old data
☐ DNS: verify domain ownership in M365 admin centre
☐ Licenses: purchase and assign Exchange Online licenses
☐ Coexistence: configure Hybrid Exchange (Exchange Hybrid config wizard)

DNS records to update:
☐ MX → point to M365 (outlook.com) at cutover
☐ Autodiscover CNAME → autodiscover.outlook.com
☐ SPF/DKIM/DMARC → update for M365

Migration:
☐ Use Exchange Admin Center → Migration → New (Cutover, Staged, or Hybrid)
☐ Hybrid migration (recommended): move mailboxes in batches, test each batch
☐ Move shared mailboxes, distribution lists, resource mailboxes

Post-migration:
☐ Update Autodiscover → test Outlook profile recreation
☐ Retire/decommission on-prem Exchange (keep 1 server 180 days for hybrid)
☐ Monitor email flow for 2 weeks`,
    jobTypes: ["Sysadmin"],
    difficulty: "Expert",
    tags: ["Exchange Online", "Microsoft 365", "migration", "hybrid", "DNS", "mailbox"]
  },
];
