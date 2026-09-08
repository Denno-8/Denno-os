import React, { useState } from "react";
import { X, Copy, Check, Sparkles, Search, MessageSquare, Send, MailCheck, UserPlus, DollarSign, FileQuestion } from "lucide-react";

export interface ApplicationTemplate {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  description: string;
  subject: string;
  template: string;
}

const TEMPLATES: ApplicationTemplate[] = [
  {
    id: "cold_outreach",
    title: "Cold Recruiter Outreach",
    category: "Outreach",
    icon: <Send className="w-4 h-4 text-blue-500" />,
    description: "Direct intro highlighting core skills & role fit to hiring managers and recruiters.",
    subject: "Inquiry: [Role Title] — [Your Name] | [Key Skill 1] Specialist",
    template: `Hi [Recipient Name],

I hope this message finds you well.

I’ve been following [Company Name]’s recent growth in the tech ecosystem and was thrilled to see your opening for the [Role Title] position. 

With over [Years of Experience] years of hands-on experience in building scalable backend systems using [Key Skill 1], [Key Skill 2], and modern cloud architecture, I believe my background aligns closely with what [Company Name] is building.

In my recent projects, I’ve architected high-throughput services that improved system performance by 40% and reduced API latencies. I’d love the opportunity to briefly connect and share how my expertise can drive immediate value for your engineering team.

Are you available for a brief 10-minute call later this week?

Best regards,
[Your Name]
[LinkedIn / Portfolio URL]`
  },
  {
    id: "post_interview_thankyou",
    title: "Post-Interview Thank You & Follow-up",
    category: "Follow-up",
    icon: <MailCheck className="w-4 h-4 text-emerald-500" />,
    description: "Timely note summarizing key interview discussion points and expressing enthusiasm.",
    subject: "Thank You — [Role Title] Interview | [Your Name]",
    template: `Hi [Recipient Name],

Thank you so much for taking the time to speak with me today about the [Role Title] role at [Company Name]. I really enjoyed our conversation, especially learning more about [Key Interview Topic / Project discussed].

Our discussion further confirmed my enthusiasm for joining [Company Name]. My experience in [Key Skill 1] and [Key Skill 2] positions me well to help solve [Specific Challenge discussed in interview].

Please let me know if you need any additional materials or references from my end. I look forward to hearing about next steps.

Best regards,
[Your Name]`
  },
  {
    id: "internal_referral",
    title: "Internal Referral Request",
    category: "Networking",
    icon: <UserPlus className="w-4 h-4 text-purple-500" />,
    description: "Polite message asking network connection for internal referral for open position.",
    subject: "Quick question regarding [Company Name] / [Role Title]",
    template: `Hi [Recipient Name],

I hope you’re having a great week!

I noticed that [Company Name] is currently hiring for a [Role Title] role. Knowing your background at the company, I wanted to reach out and see how you’ve enjoyed working there.

I have extensive experience in [Key Skill 1] and [Key Skill 2], and I’m really excited about [Company Name]’s mission. If you feel comfortable, I would be deeply grateful for an internal referral or an intro to the hiring team.

I’ve attached my updated CV for your convenience. Thanks so much for your time and guidance!

Best,
[Your Name]`
  },
  {
    id: "salary_negotiation",
    title: "Salary & Offer Negotiation",
    category: "Negotiation",
    icon: <DollarSign className="w-4 h-4 text-amber-500" />,
    description: "Tactful, metric-backed compensation request upon receiving an offer.",
    subject: "Offer Discussion — [Role Title] | [Your Name]",
    template: `Dear [Recipient Name],

Thank you so much for extending the offer to join [Company Name] as a [Role Title]! I am thrilled about the prospect of contributing to the team and building impactful products together.

Before finalizing, I wanted to discuss the proposed compensation package. Based on market benchmark data for senior roles requiring expertise in [Key Skill 1] and [Key Skill 2], as well as my proven track record in [Key Achievement], I would like to explore a base compensation closer to [Target Salary Range].

I am confident in the value I will bring to [Company Name] from Day 1 and would love to align on a figure that reflects this impact.

Thank you again for your time and flexibility. I look forward to reaching an agreement!

Warm regards,
[Your Name]`
  },
  {
    id: "rejection_feedback",
    title: "Rejection Response & Feedback Request",
    category: "Follow-up",
    icon: <MessageSquare className="w-4 h-4 text-rose-500" />,
    description: "Gracious note keeping doors open and requesting constructive feedback.",
    subject: "Re: Update on [Role Title] Application — [Your Name]",
    template: `Hi [Recipient Name],

Thank you for letting me know about your decision regarding the [Role Title] position. While I am disappointed not to be moving forward, I truly appreciated the opportunity to interview with the team at [Company Name].

If you have a moment, I would be incredibly grateful for any feedback you could share regarding my interview performance or areas where I can strengthen my profile.

I remain a big fan of [Company Name]’s work and would love to stay in touch for future opportunities that align with my background in [Key Skill 1].

Wishing you and the team all the best!

Warmly,
[Your Name]`
  },
  {
    id: "status_checkin",
    title: "Application Status Inky Check-in",
    category: "Follow-up",
    icon: <FileQuestion className="w-4 h-4 text-indigo-500" />,
    description: "Polite follow-up note sent after 1-2 weeks of no response.",
    subject: "Following Up: [Role Title] Application — [Your Name]",
    template: `Hi [Recipient Name],

I hope you’re having a productive week!

I wanted to follow up on my application for the [Role Title] role submitted on [Application Date]. I remain very interested in the position and [Company Name]’s ongoing initiatives in [Industry / Tech Focus].

Please let me know if you require any additional information or if there are any updates regarding the hiring timeline.

Thank you for your time and consideration!

Best regards,
[Your Name]`
  }
];

export interface ApplicationTemplatesModalProps {
  onClose: () => void;
  onSelectTemplate?: (content: string, subject?: string) => void;
}

export default function ApplicationTemplatesModal({ onClose, onSelectTemplate }: ApplicationTemplatesModalProps) {
  const [selectedId, setSelectedId] = useState<string>(TEMPLATES[0].id);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  // Dynamic variable states
  const [recipientName, setRecipientName] = useState("Alex");
  const [companyName, setCompanyName] = useState("Safaricom");
  const [roleTitle, setRoleTitle] = useState("Senior Backend Engineer");
  const [keySkill1, setKeySkill1] = useState("FastAPI");
  const [keySkill2, setKeySkill2] = useState("PostgreSQL");
  const [yourName, setYourName] = useState("Dennis");

  const filtered = TEMPLATES.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  const current = TEMPLATES.find((t) => t.id === selectedId) || TEMPLATES[0];

  const getSubstitutedText = (raw: string) => {
    return raw
      .replace(/\[Recipient Name\]/g, recipientName || "[Recipient Name]")
      .replace(/\[Company Name\]/g, companyName || "[Company Name]")
      .replace(/\[Role Title\]/g, roleTitle || "[Role Title]")
      .replace(/\[Key Skill 1\]/g, keySkill1 || "[Key Skill 1]")
      .replace(/\[Key Skill 2\]/g, keySkill2 || "[Key Skill 2]")
      .replace(/\[Your Name\]/g, yourName || "[Your Name]")
      .replace(/\[Years of Experience\]/g, "4")
      .replace(/\[Application Date\]/g, "recently")
      .replace(/\[Target Salary Range\]/g, "KES 550,000 - KES 700,000")
      .replace(/\[LinkedIn \/ Portfolio URL\]/g, "linkedin.com/in/dennis-dev");
  };

  const formattedSubject = getSubstitutedText(current.subject);
  const formattedBody = getSubstitutedText(current.template);

  const handleCopy = () => {
    const fullText = `Subject: ${formattedSubject}\n\n${formattedBody}`;
    navigator.clipboard?.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (onSelectTemplate) {
      onSelectTemplate(formattedBody, formattedSubject);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Application Templates Suite
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready-to-use professional outreach & follow-up message library with dynamic variable replacement
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: Template List */}
          <div className="md:col-span-5 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/30">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500"
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {filtered.map((t) => {
                const active = t.id === selectedId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      active
                        ? "bg-white dark:bg-slate-900 border-blue-500 shadow-md ring-1 ring-blue-500/20"
                        : "bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {t.icon} {t.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Template Customization & Preview */}
          <div className="md:col-span-7 p-6 flex flex-col overflow-y-auto space-y-4">
            {/* Dynamic Controls Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Customize Placeholders
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-0.5">Recipient</label>
                  <input
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg font-medium outline-none text-slate-900 dark:text-slate-100 text-xs"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-0.5">Company</label>
                  <input
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg font-medium outline-none text-slate-900 dark:text-slate-100 text-xs"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-0.5">Role Title</label>
                  <input
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg font-medium outline-none text-slate-900 dark:text-slate-100 text-xs"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-0.5">Key Skill 1</label>
                  <input
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg font-medium outline-none text-slate-900 dark:text-slate-100 text-xs"
                    value={keySkill1}
                    onChange={(e) => setKeySkill1(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-0.5">Key Skill 2</label>
                  <input
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg font-medium outline-none text-slate-900 dark:text-slate-100 text-xs"
                    value={keySkill2}
                    onChange={(e) => setKeySkill2(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-0.5">Your Name</label>
                  <input
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg font-medium outline-none text-slate-900 dark:text-slate-100 text-xs"
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Template Body Preview Box */}
            <div className="flex-1 flex flex-col space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject Line:</div>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                {formattedSubject}
              </div>

              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Message Body Preview:</div>
              <textarea
                readOnly
                className="w-full flex-1 min-h-[220px] p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs leading-relaxed font-mono text-slate-800 dark:text-slate-200 outline-none resize-none"
                value={formattedBody}
              />
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {onSelectTemplate && (
                <button
                  onClick={handleInsert}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Insert Into Form
                </button>
              )}
              <button
                onClick={handleCopy}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Subject & Message"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
