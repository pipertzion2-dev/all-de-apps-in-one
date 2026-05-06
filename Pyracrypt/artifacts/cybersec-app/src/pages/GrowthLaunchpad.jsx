import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'

const STORAGE_KEY   = 'pyracrypt_growth_done'
const ADMIN_KEY     = 'pyracrypt_admin_v1'
const SECRET_PARAM  = 'launch2026'   // visit /growth?key=launch2026 to unlock

const TASKS = [
  // ── ECOSYSTEM SETUP
  {
    cat: 'Ecosystem Setup', catColor: '#3e6a9a', tasks: [
      { id: 'deploy_pyracrypt',  label: 'Verify Pyracrypt is live',        detail: 'Check your deployed app is reachable',                         action: 'open',  url: 'https://cyberwavysecurity.replit.app', btn: 'Open Live App' },
      { id: 'deploy_svivva',     label: 'Deploy Svivva on Replit',         detail: 'Go to your Svivva Repl → click Deploy → Autoscale',            action: 'open',  url: 'https://replit.com/repls', btn: 'Open Replit' },
      { id: 'update_svivva_url', label: 'Update Svivva footer link',       detail: 'Paste the real Svivva .replit.app URL into the Pyracrypt footer cross-promo strip', action: 'copy', text: 'https://svivva.replit.app', btn: 'Copy Placeholder URL' },
      { id: 'orbit_signup',      label: 'Create Orbit workspace',          detail: 'Free tier — up to 1,000 members, 2 integrations',              action: 'open',  url: 'https://orbit.love', btn: 'Open Orbit.love' },
      { id: 'mailchimp',         label: 'Set up free Mailchimp list',      detail: 'Free up to 500 contacts — one list for both apps',             action: 'open',  url: 'https://mailchimp.com/signup/', btn: 'Open Mailchimp' },
      { id: 'discord',           label: 'Create Discord community server', detail: '"Pyracrypt Security Hub" — connect to Orbit as 2nd data source', action: 'open', url: 'https://discord.com/channels/@me', btn: 'Open Discord' },
      { id: 'utm_links',         label: 'Copy UTM cross-link for Svivva',  detail: 'Add this to every link from Pyracrypt → Svivva',               action: 'copy',  text: '?utm_source=pyracrypt&utm_medium=footer&utm_campaign=ecosystem', btn: 'Copy UTM Params' },
    ]
  },

  // ── FREE DIRECTORIES
  {
    cat: 'AI & Tool Directories', catColor: '#5a9040', tasks: [
      { id: 'futurepedia',   label: 'Submit to Futurepedia',                detail: 'One of the largest AI tool directories — free listing',         action: 'open', url: 'https://www.futurepedia.io/submit-tool', btn: 'Submit Tool' },
      { id: 'theresanai',    label: "Submit to There's An AI For That",     detail: 'High-traffic AI tool directory — free',                         action: 'open', url: 'https://theresanaiforthat.com/get-listed/', btn: 'Get Listed' },
      { id: 'toolify',       label: 'Submit to Toolify.ai',                 detail: 'Growing AI tool index — free submission',                       action: 'open', url: 'https://www.toolify.ai/submit', btn: 'Submit' },
      { id: 'aitoptools',    label: 'Submit to AI Top Tools',               detail: 'Free AI directory with good SEO authority',                     action: 'open', url: 'https://aitoptools.com/submit-tool/', btn: 'Submit' },
      { id: 'g2',            label: 'Create G2 listing (free)',             detail: 'G2 is the #1 SaaS review site — free vendor page',             action: 'open', url: 'https://sell.g2.com/free-profile', btn: 'Create Listing' },
      { id: 'capterra',      label: 'Submit to Capterra',                   detail: 'Free basic listing — reach buyers actively evaluating tools',   action: 'open', url: 'https://www.capterra.com/vendors/sign-up', btn: 'Submit' },
      { id: 'alternativeto', label: 'Add to AlternativeTo',                 detail: 'List Pyracrypt as an alternative to Qualys, Tenable, etc.',    action: 'open', url: 'https://alternativeto.net/add-software/', btn: 'Add App' },
      { id: 'producthunt_ship', label: 'Add to Product Hunt "Ship"',       detail: 'Start collecting upvotes and followers before launch day',      action: 'open', url: 'https://www.producthunt.com/products/new', btn: 'Create Ship Page' },
    ]
  },

  // ── REDDIT
  {
    cat: 'Reddit Strategy', catColor: '#b87060', tasks: [
      { id: 'reddit_netsec',   label: 'Join r/netsec',                      detail: 'Main security research sub — post helpful content, no spam',   action: 'open', url: 'https://reddit.com/r/netsec', btn: 'Open Subreddit' },
      { id: 'reddit_cyber',    label: 'Join r/cybersecurity',                detail: '800K+ members — great for threat intel posts',                 action: 'open', url: 'https://reddit.com/r/cybersecurity', btn: 'Open Subreddit' },
      { id: 'reddit_sysadmin', label: 'Join r/sysadmin',                     detail: 'IT professionals — target audience for scanning tools',         action: 'open', url: 'https://reddit.com/r/sysadmin', btn: 'Open Subreddit' },
      { id: 'reddit_iib',      label: 'Post in r/InternetIsBeautiful',       detail: 'Copy the template post below, customize and submit',           action: 'copy',
        text: `Title: I built a free AI-powered security scanner that maps your attack surface in under 60 seconds

I've spent the last few months building Pyracrypt — an AI tool that runs a full attack surface scan on any URL or API endpoint.

It runs 5 analysis engines:
• Surface mapping — finds exposed endpoints, services, and entry points
• AI attack simulation — generates realistic attack chains based on your stack
• Compliance check — NIST, OWASP, SOC 2 alignment
• Auto-remediation — generates patch suggestions you can apply immediately
• Hybrid OR — combines technical vulnerabilities + social engineering threats

It's free to try. No signup required for the basic scan.

[your URL here]

Happy to answer any questions about how the AI pipeline works.`,
        btn: 'Copy Post Template' },
      { id: 'hn_post',         label: 'Post "Show HN" on Hacker News',      detail: 'Copy the HN post template and submit at news.ycombinator.com/submit', action: 'copy',
        text: `Show HN: Pyracrypt – AI attack surface scanner that runs 5 threat-analysis engines in parallel

I built a security tool that maps attack surfaces using an AI pipeline: hypothesize → combine → mutate → simulate → remediate.

The backend is FastAPI + Python. The AI pipeline chains multiple analysis steps — each step feeds the next, building a complete threat model from a single URL input.

It also has a "Hybrid OR" mode that layers social engineering threat detection on top of technical vulnerability scanning.

Free to try: [your URL]

The most interesting technical challenge was the pipeline state management — happy to go into detail if anyone's curious.`,
        btn: 'Copy HN Template' },
      { id: 'hn_submit',       label: 'Submit to Hacker News',              detail: 'Go to Show HN and paste your post',                            action: 'open', url: 'https://news.ycombinator.com/submit', btn: 'Submit to HN' },
    ]
  },

  // ── PRODUCT HUNT
  {
    cat: 'Product Hunt Launch', catColor: '#865a8a', tasks: [
      { id: 'ph_profile',   label: 'Build your Product Hunt profile',       detail: 'Profile pic, bio, social links — needs to look credible',     action: 'open', url: 'https://www.producthunt.com/settings/profile', btn: 'Edit Profile' },
      { id: 'ph_follow',    label: 'Follow 20 active PH makers',            detail: 'People you follow are notified when you launch',               action: 'open', url: 'https://www.producthunt.com/makers', btn: 'Browse Makers' },
      { id: 'ph_comment',   label: 'Comment on 3 launches today',           detail: 'Build karma — PH algorithm favors active community members',  action: 'open', url: 'https://www.producthunt.com', btn: 'Browse Launches' },
      { id: 'ph_hunter',    label: 'Find a hunter with 500+ followers',     detail: 'A good hunter boosts visibility dramatically',                 action: 'open', url: 'https://www.producthunt.com/makers?order=followers', btn: 'Find Hunters' },
      { id: 'ph_tagline',   label: 'Copy Pyracrypt PH tagline',             detail: 'Use this as your Product Hunt tagline',                        action: 'copy', text: 'AI-powered attack surface scanner — detect threats before they strike', btn: 'Copy Tagline' },
      { id: 'ph_description', label: 'Copy Pyracrypt PH description',      detail: 'Paste this into your Product Hunt product description',        action: 'copy',
        text: `Pyracrypt runs 5 AI-powered threat analysis engines in parallel on any URL or API endpoint:

🛡️ Surface Mapping — discovers exposed endpoints and services
⚡ AI Attack Simulation — generates realistic attack chains
✅ Compliance Check — NIST, OWASP, SOC 2 alignment scoring  
🔧 Auto-Remediation — generates patch suggestions instantly
🔀 Hybrid OR — technical vulns + social engineering threats combined

No setup. No agent install. Scan any target in under 60 seconds.

Built for: security engineers, DevSecOps, startup CTOs, and compliance teams who need fast, actionable threat intelligence without enterprise pricing.`,
        btn: 'Copy Description' },
    ]
  },

  // ── MONETIZATION
  {
    cat: 'Monetization Setup', catColor: '#a07040', tasks: [
      { id: 'stripe',       label: 'Create Stripe account',                 detail: 'Set up payments — Starter $19/mo, Pro $49/mo, Business $149/mo', action: 'open', url: 'https://dashboard.stripe.com/register', btn: 'Open Stripe' },
      { id: 'affiliate',    label: 'Set up affiliate tracking with Rewardful', detail: 'Free 14-day trial — 20% recurring affiliate commission',    action: 'open', url: 'https://www.rewardful.com/', btn: 'Open Rewardful' },
      { id: 'lemon',        label: 'Alternative: Lemon Squeezy (all-in-one)', detail: 'Handles payments + affiliate + licensing — simpler than Stripe', action: 'open', url: 'https://www.lemonsqueezy.com/', btn: 'Open Lemon Squeezy' },
      { id: 'trustpilot',   label: 'Create free Trustpilot business page', detail: 'Social proof — ask your first 5 users to leave a review',      action: 'open', url: 'https://business.trustpilot.com/signup', btn: 'Create Page' },
    ]
  },

  // ── ORBIT COMMUNITY
  {
    cat: 'Orbit Community', catColor: '#6D91B3', tasks: [
      { id: 'orbit_connect_github', label: 'Connect GitHub to Orbit',      detail: 'First integration — tracks stars, forks, issues as activities', action: 'open', url: 'https://orbit.love', btn: 'Go to Orbit' },
      { id: 'orbit_connect_discord', label: 'Connect Discord to Orbit',    detail: 'Second integration — tracks messages and joins',               action: 'open', url: 'https://orbit.love', btn: 'Go to Orbit' },
      { id: 'orbit_custom_activities', label: 'Set up custom Orbit activities', detail: 'Log "Ran Pyracrypt scan" and "Visited Svivva" as community activities', action: 'open', url: 'https://orbit.love', btn: 'Go to Orbit' },
      { id: 'orbit_champions', label: 'Create Champions Program in Orbit', detail: 'DM your top 10 users — offer free Pro access in exchange for testimonials', action: 'copy', text: "Hey! I noticed you've been using Pyracrypt — really appreciate it. I'm building out the community and would love to give you a free Pro account in exchange for a quick testimonial or review. Interested?", btn: 'Copy DM Template' },
    ]
  },
]

const FLAT_TASKS = TASKS.flatMap(c => c.tasks.map(t => ({ ...t, cat: c.cat })))
const TOTAL = FLAT_TASKS.length

function loadDone() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
  catch { return new Set() }
}

function saveDone(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export default function GrowthLaunchpad() {
  const [, navigate] = useLocation()

  // ── Access gate: requires ?key=launch2026 once, then remembers via localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const keyParam = params.get('key')
    if (keyParam === SECRET_PARAM) {
      localStorage.setItem(ADMIN_KEY, '1')
      // Remove the key from the URL without reloading
      const clean = window.location.pathname
      window.history.replaceState(null, '', clean)
      return
    }
    if (localStorage.getItem(ADMIN_KEY) !== '1') {
      navigate('/')
    }
  }, [])

  const [done, setDone] = useState(loadDone)
  const [copied, setCopied] = useState(null)

  const doneCount = done.size
  const pct = Math.round((doneCount / TOTAL) * 100)

  function toggleDone(id) {
    setDone(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveDone(next)
      return next
    })
  }

  function handleAction(task) {
    if (task.action === 'open') {
      window.open(task.url, '_blank', 'noopener')
    } else if (task.action === 'copy') {
      navigator.clipboard.writeText(task.text).then(() => {
        setCopied(task.id)
        setTimeout(() => setCopied(null), 2000)
      })
    }
    setTimeout(() => toggleDone(task.id), 300)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #E8EDF5 0%, #EDF1F7 60%, #E4EAF2 100%)', paddingTop: 72 }}>

      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: '0 28px',
        display: 'flex', alignItems: 'center', gap: 16, height: 56,
      }}>
        <button onClick={() => navigate('/')} style={{
          padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
          background: 'transparent', border: '1px solid rgba(0,0,0,0.14)',
          fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#606870',
        }}>← Home</button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#1e2228', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Growth Launchpad — {doneCount}/{TOTAL} complete
          </div>
          <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2, width: 240 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${pct}%`,
              background: pct === 100
                ? '#5a9040'
                : 'linear-gradient(to right, #3e6a9a, #865a8a)',
              transition: 'width 0.4s ease',
              boxShadow: '0 0 6px rgba(62,106,154,0.5)',
            }}/>
          </div>
        </div>

        <div style={{
          fontSize: 18, fontWeight: 900, color: pct === 100 ? '#5a9040' : '#3e6a9a',
          minWidth: 42, textAlign: 'right',
        }}>{pct}%</div>
      </div>

      {/* Page title */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 20, height: 1.5, background: '#a07040', display: 'inline-block', borderRadius: 1 }}/>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#606870' }}>
            Pyracrypt × Svivva
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, color: '#1e2228',
          textTransform: 'uppercase', lineHeight: 0.95, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          Growth<br/>
          <span style={{ color: '#3e6a9a' }}>Launchpad</span>
        </h1>
        <p style={{ fontSize: 12, color: '#505860', lineHeight: 1.8, maxWidth: 520, marginBottom: 32 }}>
          Every action from your strategy — one click to execute. Click the button to open
          the site or copy the text, then check it off. Progress saves automatically.
        </p>
      </div>

      {/* Task sections */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 60px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {TASKS.map(section => {
          const sectionDone = section.tasks.filter(t => done.has(t.id)).length
          return (
            <div key={section.cat} style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.70)',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
            }}>
              {/* Section header */}
              <div style={{
                padding: '14px 20px',
                background: `${section.catColor}11`,
                borderBottom: `1px solid ${section.catColor}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: section.catColor, boxShadow: `0 0 6px ${section.catColor}` }}/>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: section.catColor }}>
                    {section.cat}
                  </span>
                </div>
                <span style={{ fontSize: 9, color: '#808890', fontWeight: 700 }}>
                  {sectionDone}/{section.tasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {section.tasks.map((task, i) => {
                  const isDone = done.has(task.id)
                  const isCopied = copied === task.id
                  return (
                    <div key={task.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr auto',
                      gap: 12, alignItems: 'center',
                      padding: '13px 20px',
                      borderBottom: i < section.tasks.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      background: isDone ? 'rgba(90,144,64,0.04)' : 'transparent',
                      transition: 'background 0.2s',
                    }}>
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleDone(task.id)}
                        style={{
                          width: 22, height: 22, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                          background: isDone ? section.catColor : 'rgba(255,255,255,0.7)',
                          border: `1.5px solid ${isDone ? section.catColor : 'rgba(0,0,0,0.18)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, color: 'white', fontWeight: 800,
                          transition: 'all 0.15s',
                        }}
                      >
                        {isDone ? '✓' : ''}
                      </button>

                      {/* Label + detail */}
                      <div>
                        <div style={{
                          fontSize: 11.5, fontWeight: 700,
                          color: isDone ? '#808890' : '#1e2228',
                          textDecoration: isDone ? 'line-through' : 'none',
                          marginBottom: 2,
                          transition: 'color 0.2s',
                        }}>{task.label}</div>
                        <div style={{ fontSize: 9.5, color: '#909aa0', lineHeight: 1.5 }}>{task.detail}</div>
                      </div>

                      {/* Action button */}
                      <button
                        onClick={() => handleAction(task)}
                        style={{
                          padding: '6px 14px', borderRadius: 20, cursor: 'pointer', flexShrink: 0,
                          fontSize: 8, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          background: isCopied
                            ? 'rgba(90,144,64,0.15)'
                            : `${section.catColor}14`,
                          border: `1px solid ${isCopied ? 'rgba(90,144,64,0.4)' : `${section.catColor}40`}`,
                          color: isCopied ? '#5a9040' : section.catColor,
                          transition: 'all 0.15s',
                        }}
                      >
                        {isCopied ? '✓ Copied!' : task.btn}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Completion state */}
        {doneCount === TOTAL && (
          <div style={{
            textAlign: 'center', padding: '32px',
            background: 'rgba(90,144,64,0.08)',
            border: '1px solid rgba(90,144,64,0.3)',
            borderRadius: 14,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#5a9040', marginBottom: 6 }}>
              All tasks complete!
            </div>
            <div style={{ fontSize: 11, color: '#606870' }}>
              You've executed the full 30-day growth plan. Now stay consistent — 
              post on Reddit 3×/week, engage in your Discord daily, and prepare your Product Hunt launch.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
