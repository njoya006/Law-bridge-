# LawBridge — Product Vision & System Evolution Document
**Version 2.0 | July 2026 | Confidential — Internal Strategy**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What We Have Built — Full System Audit](#2-what-we-have-built)
3. [The Strategic Pivot — From Software to Ecosystem](#3-the-strategic-pivot)
4. [The Four Pillars](#4-the-four-pillars)
5. [New Navigation Architecture](#5-new-navigation-architecture)
6. [New Features — What We Are Adding](#6-new-features)
7. [Behavior Changes — How the System Will Feel Different](#7-behavior-changes)
8. [Design System Upgrades](#8-design-system-upgrades)
9. [Technical Implementation Plan](#9-technical-implementation-plan)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [AI Strategy](#11-ai-strategy)
12. [Team Message](#12-team-message)

---

## 1. Executive Summary

LawBridge started as a legal practice management system. After validation with a real law firm, it is clear that the opportunity is much larger.

**Old vision:** Help law firms manage their internal operations.

**New vision:** Become Africa's Digital Legal Ecosystem — the place where legal professionals connect, collaborate, grow, and manage their practice.

This document records everything that exists, everything that will change, and exactly how we will build it. Nothing is removed. Everything is expanded.

**Current Rating:** Product Design 9/10 · Product Vision (new) 9.8/10

---

## 2. What We Have Built — Full System Audit

### 2.1 Backend Architecture

**14 microservices** running on a shared EC2 t3.medium instance via Docker Compose, with shared PostgreSQL (one database per service) and Redis pub/sub.

| Service | Port | Purpose |
|---|---|---|
| auth-service | 8001 | JWT authentication, user accounts, roles, firm membership |
| lawyer-service | 8003 | Lawyer profiles, firm management, verification |
| case-service | 8004 | Case lifecycle (16+ statuses), matter management, triage |
| calendar-service | 8008 | Bookings, consultations, availability |
| monitoring-service | 8009 | Case progress snapshots, Redis consumer, reports |
| client-service | internal | Client profiles, case visibility |
| document-service | — | Document vault, file uploads, virus scanning |
| library-service | 8013 | CamLex legal library, articles, publications |
| messaging-service | — | Real-time threads, client-lawyer messaging |
| notification-service | — | Push/in-app notifications |
| payment-service | — | MTN Mobile Money, Orange Money, XAF invoicing |
| search-service | — | Full-text search across lawyers, firms, cases |
| ai-assistant-service | — | LexAI chat, document drafting, research, analysis |
| frontend | 3000 | Next.js 14 app with all portals |

**Infrastructure:**
- AWS us-east-1, account 820561684310
- RDS PostgreSQL (shared, DB-per-service pattern)
- Redis for pub/sub (case.updated → monitoring consumer)
- SSM Parameter Store for all production secrets
- GitHub Actions CI/CD → ECR → Docker on EC2
- Vercel for frontend deployment
- Auth pattern: JWT + AuthProxyAuthentication (maps JWT email → local integer PK in each service)

### 2.2 Frontend Pages — Full Inventory

**Public pages:**
- `/` — Landing page (15 sections, bilingual EN/FR, animated)
- `/about` — About page
- `/support` — Support/contact
- `/book` — Public booking page (clients book without account)
- `/discover` — Public lawyer/firm discovery
- `/discover/lawyer/[id]` — Public lawyer profile
- `/discover/firm/[id]` — Public firm profile
- `/library` — CamLex public library browse
- `/library/[id]` — Book reader with watermark
- `/library/articles/[id]` — Article reader
- `/library/firm/[firmId]` — Firm's private library

**Auth:**
- `/auth/login` — Client login
- `/auth/lawyer-login` — Lawyer/secretary login
- `/auth/register` — Client registration
- `/auth/law-firm` — Law firm registration
- `/auth/forgot-password` — Password reset flow
- `/auth/reset-password` — Password reset confirmation

**Lawyer portal** (`/lawyer/*` — LawyerShell layout with sidebar):
- `/lawyer/dashboard` — KPIs, case overview, recent activity
- `/lawyer/matters` — Full case list with status management
- `/lawyer/clients` — Client list and profiles
- `/lawyer/documents` — Document vault
- `/lawyer/calendar` — Calendar view and availability
- `/lawyer/bookings` — Consultation bookings
- `/lawyer/billing` — Invoicing, payment tracking, XAF
- `/lawyer/reports` — Monitoring reports, analytics
- `/lawyer/settings` — Account and firm settings
- `/lawyer/profile` — Lawyer public profile editor
- `/lawyer/team` — Firm team management
- `/lawyer/ai` — LexAI: Chat, Drafts, Analysis, Contract Review, Legal Research (5 tabs)
- `/lawyer/triage` — AI-powered case triage and intake
- `/lawyer/verify` — Lawyer verification request
- `/lawyer/discover` — Discover other lawyers/firms
- `/lawyer/discover/firm/[id]` — Firm detail
- `/lawyer/discover/lawyer/[id]` — Lawyer detail
- `/lawyer/office/me` — My office overview
- `/lawyer/office/me/matters` — My matters subview
- `/lawyer/office/me/clients` — My clients subview
- `/lawyer/office/me/documents` — My documents subview
- `/lawyer/office/me/calendar` — My calendar subview
- `/lawyer/office/me/settings` — Office settings
- `/lawyer/office/[id]` — Associate's office (firm admin view)
- `/lawyer/library` — My publications management
- `/lawyer/library/new` — New book wizard
- `/lawyer/library/[id]/edit` — Edit published book
- `/lawyer/library/articles/new` — New article
- `/lawyer/library/articles/[id]/edit` — Edit article
- `/lawyer/firm/verify` — Firm verification request
- `/lawyer/admin` — Admin panel (seat management)

**Secretary portal** (`/secretary/*`):
- `/secretary/dashboard` — Secretary operations overview
- `/secretary/members` — Firm member list
- `/secretary/intake` — Client intake management
- `/secretary/reports` — Report generation
- `/secretary/payments` — Payment processing
- `/secretary/bookings` — Booking management
- `/secretary/intelligence` — AI secretary intelligence tools

**Client portal** (`/*` shared routes):
- `/dashboard` — Client dashboard
- `/cases` — Client's cases
- `/cases/[caseId]` — Case detail
- `/cases/new` — Open new case
- `/bookings` — Client bookings
- `/bookings/[id]` — Booking detail
- `/payments` — Payment history
- `/analyses` — Document analyses
- `/documents` — Document vault (client)
- `/profile` — Client profile
- `/settings` — Settings
- `/messages` — Messaging threads
- `/notifications` — Notifications inbox
- `/chat` — Live chat interface
- `/ai` — AI assistant (client-facing)
- `/upload` — Document upload
- `/intake/[token]` — Intake form (public, token-gated)
- `/accept-invite/[token]` — Accept firm invite
- `/firms/[firmId]/invite` — Firm invitation landing

**Admin panel** (`/admin/*`):
- `/admin` — Admin dashboard
- `/admin/users` — User management
- `/admin/verification` — Verification queue
- `/admin/content` — Content moderation
- `/admin/support` — Support tickets
- `/admin/analytics` — Platform analytics
- `/admin/risks` — Risk monitoring
- `/admin/intelligence` — Admin AI tools

### 2.3 Current Feature Summary

**Practice Management:**
- Case lifecycle with 16+ statuses (draft → intake → active → judgment → closed)
- AI-powered case triage with lawyer-matching score (0–100)
- Full audit timeline per case
- Case notes, documents, and tasks per matter
- Conflict detection on case assignment
- Open case marketplace

**Firm Management:**
- 5 roles: Owner, Admin, Partner, Associate, Guest
- Invitation system with tokenized links
- Seat management and subscription tiers
- Partnership program (revenue share, specialization alignment)
- Secretary portal for administrative staff
- Firm verification with badge system

**Client Experience:**
- Self-service case opening
- Real-time case status tracking
- Secure document sharing
- Tokenized intake forms
- XAF payment with MTN Mobile Money and Orange Money
- Direct messaging with legal team
- Bilingual support (English/French)

**AI Capabilities (LexAI — 5 tabs):**
- Chat: conversational legal assistant, session history, streaming responses
- Legal Drafts: 10+ document types (demand letters, motions, affidavits, memoranda, appeals, clauses), clarifying questions wizard, bilingual output (EN/FR streaming), saved drafts library
- Document Analysis: PDF/DOCX upload, AI summary, key points, risks, recommendations
- Contract Review: Clause-by-clause risk scoring, missing clause detection, OHADA compliance, copy report
- Legal Research: Cameroonian Civil Code, Common Law, OHADA citations, confidence scoring, session continuity

**CamLex Legal Library:**
- 26 published books covering: OHADA, Labour Law, Criminal, Constitutional, Land, Tax, Banking, IP, Arbitration, Criminal Procedure, Family, Environmental, Human Rights, Administrative, Civil Procedure, International, Civil, Legal Ethics, Customary Law
- Article publishing for lawyers
- Firm private library (tier: firm)
- Watermark overlay on book reader
- Lawyer publication management portal

**Payments & Billing:**
- XAF invoicing system
- MTN Mobile Money integration
- Orange Money integration
- Bank transfer option
- Invoice lifecycle: Draft → Issued → Paid
- Payment history and receipts

**Communications:**
- Real-time message threads (client-lawyer)
- AI-supported messaging
- Case-linked conversations
- In-app notification system
- Unread badge counts on sidebar

**Analytics & Monitoring:**
- Case progress snapshots via Redis pub/sub pipeline
- Report generation (firm-level)
- Secretary report requests
- Admin platform analytics and risk dashboard

**Design System:**
- Navy/Gold/Emerald/Crimson palette
- Cormorant Garamond display font + DM Sans body
- Per-portal CSS variable identity (lawyer = teal, secretary = amber, client = blue, admin = purple)
- Dark mode / Light mode toggle
- Mobile-responsive with overlay sidebar drawer (hamburger + top bar)
- Glassmorphism cards, scroll animations, bilingual toggle

---

## 3. The Strategic Pivot — From Software to Ecosystem

### 3.1 The Insight

After meeting with a real law firm, two things became clear:

1. Practice management is useful — but it is table stakes. Any software can do task management.
2. The real pain is isolation. Law firms cannot easily find trusted partners, cross-border referrals, expert co-counsel, or international opportunities. They network manually, through WhatsApp groups and conferences.

**LawBridge can solve that.**

### 3.2 The Analogy

| Platform | What they did |
|---|---|
| LinkedIn | Connected professionals — then added jobs, learning, CRM |
| Airbnb | Connected hosts and guests — then added experiences |
| LawBridge | Connect legal professionals — then add everything else |

The network effect is the moat. Once lawyers connect on LawBridge, leaving means losing their network.

### 3.3 The New Identity

**Old:** A Legal Management System

**New:** Africa's Digital Legal Ecosystem

**New single-sentence value proposition:**
> The place where legal professionals connect, collaborate, grow, and manage their practice.

### 3.4 What This Does Not Change

- Everything already built remains
- Practice management (cases, billing, documents) stays
- The AI assistant stays and grows
- CamLex library stays and grows
- All portals (lawyer, secretary, client, admin) stay
- The tech stack does not change

What changes is the front door: what lawyers see first when they log in, and the navigation structure that frames their experience.

---

## 4. The Four Pillars

Every feature on the platform now belongs to one of four pillars:

### Pillar 1 — PRACTICE
Everything needed to run a legal practice day-to-day.
Cases, Clients, Documents, Calendar, Billing, AI, Triage, Bookings

### Pillar 2 — NETWORK
The new core. Connecting the legal profession across Cameroon and Africa.
Feed, Discovery, Partnerships, Referrals, Messages, Communities, Events, Following

### Pillar 3 — KNOWLEDGE
Legal intelligence that professionals can access, contribute to, and share.
CamLex Library, Judgments, OHADA, Research, Articles, Publications, Bookmarks

### Pillar 4 — GROWTH
Tools that help lawyers build their reputation and grow their practice.
Analytics, Firm Profile, Marketing tools, Recruitment, Opportunities, Awards

---

## 5. New Navigation Architecture

### 5.1 Current Sidebar (Problem)

The current sidebar is organized by **technical function**:
My Office → Dashboard → Bookings → Messages → Notifications → Discover → Matters → Clients → Team → Documents → Library → My Publications → Get Verified → AI Assistant → Case Triage → Calendar → Billing → Reports → Settings

This communicates: "Here are all the things the system can do."

### 5.2 New Sidebar (Solution)

The new sidebar is organized by **business value and user intent**:

---

**HOME**
- Dashboard *(redesigned — see section 7)*
- Activity Feed *(new)*
- Notifications

---

**PRACTICE**
- Matters *(was: Cases)*
- Clients
- Documents
- Calendar
- Tasks *(new)*
- Billing
- Bookings
- AI Assistant

---

**NETWORK** *(new section — star icon)*
- Discover
- Lawyers
- Firms
- Partnership Requests *(new)*
- Messages
- Referrals *(new)*
- Communities *(new)*
- Events *(new)*
- Following *(new)*

---

**KNOWLEDGE**
- Legal Library *(CamLex)*
- Judgments *(new)*
- OHADA *(new — curated section)*
- Articles
- Research
- Publications *(My Publications)*
- Bookmarks *(new)*

---

**GROWTH** *(new section)*
- Analytics *(was: Reports)*
- Firm Profile
- Marketing *(new)*
- Recruitment *(new)*
- Opportunities *(new)*
- Awards *(new)*

---

**SETTINGS**
- Profile
- Firm
- Security
- Verification
- Subscription

---

### 5.3 Visual Design Changes for Sidebar

**Current:** All items at the same visual weight, flat list

**New:**
- Section headers are styled label chips (uppercase, small, gold-tinted)
- The NETWORK section has a star ⭐ suffix on the section label to signal its importance
- Active section is highlighted with the portal accent color
- Collapsed state shows section icons instead of section labels
- Notification badges appear on Feed, Messages, Partnership Requests, and Referrals
- NETWORK section items use a slightly brighter accent on hover to draw attention
- GROWTH section uses emerald accent to signal progress/achievement

### 5.4 Mobile Navigation

On mobile (below lg breakpoint), the bottom navigation bar changes to reflect the four pillars:

| Icon | Label | Maps to |
|---|---|---|
| House | Home | Dashboard + Feed |
| Briefcase | Practice | All practice tools |
| People | Network | All networking tools |
| Book | Knowledge | Library + research |
| Chart | Growth | Analytics + profile |

The existing hamburger → overlay drawer remains for full navigation access.

---

## 6. New Features

### 6.1 Activity Feed (Priority: HIGH)

**What it is:** A professional activity stream, not a social feed. Think LinkedIn, not Twitter.

**What appears in the feed:**
- Firm published a new article in CamLex
- Lawyer completed verification
- Firm is looking for a partner (Common Law / Civil Law)
- Legal conference announced in Douala
- New OHADA regulation published
- Firm seeking international co-counsel
- Referral opportunity posted
- Partnership request from [Firm Name]
- Colleague joined LawBridge
- New judgment published (relevant to your practice areas)

**What does NOT appear:**
- Personal posts
- Photos
- General opinions
- Anything without professional value

**Feed algorithm (simple v1):**
1. Firms and lawyers you follow (always shown)
2. Firms in your jurisdiction/practice area
3. Partnership requests matching your specialization
4. Events within your circuit
5. OHADA publications relevant to your practice areas
6. New members at firms you are connected to

**Feed card types:**
```
[Firm Logo] KEUSSA Law Firm
Published: "Understanding the New OHADA Reforms"
12 minutes ago · Douala, Cameroon · #OHADA #CommercialLaw
[Read Article] [Save] [Share]

---

[Firm Logo] Legacy Chambers
Looking for: UK Corporate Partner for cross-border matters
Posted 2 hours ago · Yaoundé · Common Law
[View Opportunity] [Connect]

---

[Event Icon] Annual Cameroonian Bar Association Conference
Douala Hilton · March 15-17, 2027 · RSVP Open
[Register Interest]
```

**New service needed:** `feed-service` or extend `notification-service`

**Database tables:** `FeedItem (id, actor_type, actor_id, verb, object_type, object_id, target_audience, created_at)`, `FeedSubscription (follower_id, following_id, following_type)`

---

### 6.2 Discovery Engine — Upgraded (Priority: HIGH)

**Current state:** `/lawyer/discover` and `/discover` exist but are basic search pages.

**New Discovery:**

**For Lawyers (internal portal):**
- Search by: Practice area, Location (city, circuit), Language, Verified status, Years in practice, Availability for partnership
- Filter by: Firm size, Bar association, Specialization, International experience
- Sort by: Reputation score, Recent activity, Proximity, Relevance

**Recommendation cards on dashboard:**
```
Recommended for Partnership:
• Abuja Commercial Chambers — 94% match (Corporate Law, OHADA, 12 years)
• Douala Maritime Group — 87% match (Maritime, Common Law, 8 years)
• London Africa Desk — 82% match (International, Cross-border, 15 years)
```

**For Clients (public):**
- Search lawyers by: Name, Firm, Practice area, City, Language
- Filter by: Verified, Availability, Budget range, Languages spoken
- Sort by: Reputation score, Reviews, Response time
- Book consultation directly from profile

**New international filter:**
- Looking for local counsel in Cameroon
- Available for international matters
- Cross-border experience (list countries)
- Working languages beyond EN/FR

---

### 6.3 Partnership Requests (Priority: HIGH)

**What it is:** A formal system for firms to request partnerships, co-counsel arrangements, and referral agreements.

**Types of partnership:**
- Co-Counsel (collaborate on a specific matter)
- Referral Agreement (send clients to each other)
- Strategic Partnership (formal long-term arrangement)
- International Counsel (represent in another jurisdiction)

**Partnership request flow:**
1. Firm A sends a partnership request to Firm B with: type, specialization match, proposed terms, cover note
2. Firm B receives notification + feed item
3. Firm B reviews Firm A's profile and reputation
4. Firm B accepts, declines, or proposes counter-terms
5. Accepted partnership appears on both firms' profiles
6. Shared matters can now be created

**Profile badge:** "14 Active Partnerships"

**New API endpoints:** `POST /api/v1/network/partnerships/`, `PATCH /api/v1/network/partnerships/{id}/`, `GET /api/v1/network/partnerships/`

---

### 6.4 Referral System (Priority: HIGH)

**What it is:** Lawyers can formally refer clients to other lawyers/firms and track the referral.

**Referral flow:**
1. Lawyer receives a matter outside their expertise
2. Clicks "Refer Client" on the matter page
3. Selects a firm/lawyer from their network
4. Adds a referral note and sets terms (fee if applicable)
5. Receiving firm gets notified and can accept or decline
6. If accepted, client is notified and a new matter is created at the receiving firm
7. Original lawyer retains visibility (referral tracking)

**Revenue opportunity:** Platform takes 1% of referral fees processed through LawBridge payments

**Analytics:** "Referrals sent: 7 | Referrals received: 3 | Referral revenue: XAF 450,000"

---

### 6.5 Communities (Priority: MEDIUM)

**What they are:** Practice-area groups where professionals exchange knowledge, ask questions, and build reputation.

**Initial communities (8):**
1. Corporate & Commercial Lawyers
2. Tax Law Practitioners
3. Young Lawyers (under 5 years call)
4. Women in Law Cameroon
5. OHADA Experts
6. International Arbitration
7. Criminal Defense Practitioners
8. Human Rights & Constitutional Law

**Community features:**
- Discussion threads (professional only — moderated)
- Document sharing (templates, precedents)
- Q&A format with "Best Answer" marking
- Events specific to the community
- Community-exclusive job opportunities
- Expert ranking within community

**NOT social media.** No likes. No follower counts. No viral mechanics. Only professional exchange.

---

### 6.6 Reputation System — Upgraded (Priority: HIGH)

**Current:** Star ratings (basic)

**New reputation profile:**

```
┌─────────────────────────────────────────┐
│  ✓ Verified Lawyer                      │
│  ⚖ 12 Years in Practice                │
│  📚 8 Publications in CamLex           │
│  🤝 14 Active Partnerships             │
│  📨 47 Referrals Completed             │
│  🏆 3 Awards & Recognition             │
│  💬 Community Contributor (OHADA)       │
│  🌍 International Experience            │
│  ⭐ 4.9 Client Rating (23 reviews)     │
└─────────────────────────────────────────┘
```

**Reputation score (0–100):**
- Verification status: 20 points
- Years in practice: up to 15 points
- Publications: up to 15 points
- Partnerships: up to 10 points
- Referrals completed: up to 10 points
- Client ratings: up to 15 points
- Community contributions: up to 10 points
- Activity (last 30 days): up to 5 points

This score drives discovery ranking and partnership recommendation matching.

---

### 6.7 International Section (Priority: MEDIUM)

A dedicated section on the Discover page and lawyer profiles for cross-border collaboration.

**Four sub-sections:**

1. **Looking for International Partner** — Firms seeking a counterpart in another country
2. **Need Local Counsel** — International firms seeking a Cameroonian lawyer
3. **Cross-border Matters** — Open matters requiring international expertise
4. **International Opportunities** — Job postings and secondments at international firms

**This directly answers the problem the law firm raised:** They have clients with international matters and no trusted network to refer them to.

---

### 6.8 Events (Priority: MEDIUM)

**Types:**
- Conferences (Bar Association, OHADA, etc.)
- Webinars hosted by firms
- CLE/CPD sessions
- Court hearings open to observers
- Community meetups

**Event features:**
- RSVP with LawBridge account
- Add to LawBridge calendar
- Post-event recording (if webinar)
- Attendee list (professional networking)
- Event-linked community thread

---

### 6.9 Following System (Priority: MEDIUM)

- Follow firms and lawyers
- Following updates your activity feed
- Following list appears on your profile
- Followers list appears on your profile
- No follower count as vanity metric — only shown as "Your network"

---

### 6.10 Legal Marketplace (Priority: MEDIUM — client-facing)

**Different from the existing booking system.**

The marketplace is a searchable, public-facing directory where:
- Clients search by practice area, location, language, budget
- Lawyers have a public listing with profile, rates, availability
- Clients can request a consultation directly
- Payment is handled through LawBridge (MTN/Orange)
- Lawyer earns reputation points from marketplace transactions

**Revenue model:** Platform takes 5% of consultation fees paid through the marketplace.

---

### 6.11 Growth Tools (Priority: LOW — Phase 3)

**Analytics upgrade** (replacing current Reports):
- Matter velocity (how fast cases move through stages)
- Revenue trend (monthly/quarterly/yearly)
- Client retention rate
- Referral ROI
- Top practice areas by revenue
- Team utilization rate
- Comparison to platform averages (anonymized)

**Firm Profile (marketing page):**
- Public firm profile with: team, specializations, partnerships, publications, awards
- Custom URL: `lawbridge.com/firms/keussa-chambers`
- SEO-optimized

**Recruitment:**
- Post open positions within the firm
- Search for junior lawyers/associates on LawBridge
- Applicants apply through LawBridge profile

**Opportunities:**
- Secondment opportunities
- Guest lecturer roles
- Expert witness opportunities
- Advisory board invitations

**Awards:**
- Lawyers can add awards/recognition
- Platform-verified awards ("LawBridge Excellence 2026")
- Displayed prominently on profile and in search results

---

### 6.12 Tasks (Priority: LOW — simple addition to Practice)

A task list linked to matters, with:
- Assign to team member
- Due date
- Status (pending/in-progress/done)
- Linked matter
- Reminder notification

This is a small addition that completes the practice management picture.

---

### 6.13 Bookmarks (Priority: LOW)

Save articles, books, judgments, and profiles for later. Accessible from the Knowledge section.

---

### 6.14 Judgments (Priority: MEDIUM)

A curated section within Knowledge:
- Published court judgments (Supreme Court, Court of Appeal)
- Searchable by: court, date, practice area, key terms
- AI summary of each judgment
- Link to relevant CamLex books
- Lawyers can submit judgments for publication

This is a major knowledge resource not available anywhere in Cameroon today.

---

## 7. Behavior Changes

### 7.1 Dashboard — Completely Redesigned

**Current dashboard:** KPIs, case counts, recent activity

**New dashboard:**

```
Good Morning, Barrister Njoya. ☀️
Wednesday, 8 July 2026

┌─ YOUR DAY ──────────────────────────────────┐
│ 2 court appearances today                   │
│ 1 client meeting at 14:00                   │
│ 3 documents awaiting review                 │
│ Partnership request from Abuja Commercial   │
└─────────────────────────────────────────────┘

┌─ RECOMMENDED FOR YOU ───────────────────────┐
│ 🤝 Firms seeking partnership in your areas: │
│   • London Commercial Chambers (94% match)  │
│   • Maritime Law Group Douala (87% match)   │
│                         [View All →]        │
└─────────────────────────────────────────────┘

┌─ ACTIVITY FEED ─────────────────────────────┐
│ [Feed items — professional activity]         │
└─────────────────────────────────────────────┘

┌─ PRACTICE SNAPSHOT ─────────────────────────┐
│ Active matters: 12  │  Pending invoices: 3  │
│ Upcoming bookings: 5│  Unread messages: 2   │
└─────────────────────────────────────────────┘
```

The dashboard becomes the **home** — not a data screen, but a living view of the lawyer's professional world.

### 7.2 First Login Experience

**Current:** Lawyer lands on dashboard with empty state.

**New onboarding flow (5 steps):**
1. Complete your profile (photo, bio, practice areas, languages, years in practice)
2. Add your firm or join an existing one
3. Follow 3 firms in your practice area
4. Read your first recommendation
5. Explore the Network

After completing: "Your LawBridge profile is live. Firms can now discover you."

### 7.3 Lawyer Profile — Richer Public Page

**Current:** Basic profile with contact info.

**New profile includes:**
- Professional banner photo
- Bio (rich text)
- Reputation score badge
- Practice areas (with icons)
- Education and call year
- Bar admissions (Cameroon + others)
- Languages spoken
- International experience countries
- Publications in CamLex (linked)
- Active partnerships (firm names)
- Community contributions
- Awards
- Client reviews (verified only)
- Availability status ("Open to new matters" / "At capacity")
- CTA: "Request Partnership" | "Send Message" | "Book Consultation"

### 7.4 Firm Profile — Public Marketing Page

**Current:** Basic firm info in the discover page.

**New:** Full firm profile page at `/firms/[slug]`
- Firm logo and cover image
- About section
- Team members (linked to individual profiles)
- Practice areas specializations
- Notable cases (anonymized summaries — opt-in)
- Publications by firm lawyers
- Active partnerships displayed
- Awards and recognitions
- Contact and booking

### 7.5 Notifications — More Intelligent

**Current:** Generic notification list.

**New notifications include:**
- Partnership request received (with firm name and match score)
- Referral received (with matter type)
- New follower (professional, not vanity — "Abuja Chambers is following you")
- Community reply to your post
- New judgment in your practice area
- Event in your circuit
- Profile viewed by [X] firms this week
- Your article was bookmarked [X] times
- Verification badge approved
- Recommendation: "You may know [Lawyer Name] at [Firm]"

### 7.6 AI Assistant — Refocused

The AI assistant stays and grows, but the focus shifts:

**Keep all 5 tabs as they are.** Add:
- **Partner Recommendations tab**: AI suggests partnership matches based on your practice areas, matters, and network
- **Document Templates**: Pre-fill common Cameroonian legal templates based on matter type
- **Research history**: Save and revisit past research sessions
- **Judgment summaries**: AI summarizes judgments from the new Judgments section

The chat placeholder becomes more contextual: "Ask LexAI about Cameroonian law, find a partner, or summarize a judgment…"

---

## 8. Design System Upgrades

### 8.1 Color Palette — Additions

No colors are removed. These are added:

| Token | Hex | Use |
|---|---|---|
| `--network-accent` | `#6366F1` | Indigo — Network section identity |
| `--knowledge-accent` | `#8B5CF6` | Purple — Knowledge section identity |
| `--growth-accent` | `#059669` | Emerald green — Growth section identity |
| `--feed-bg` | existing navy | Feed card background |
| `--partnership-badge` | `#0D9488` | Partnership badge (teal) |
| `--reputation-gold` | `#D4A853` | Reputation score ring |
| `--verified-green` | `#10B981` | Verified checkmark |

### 8.2 New Component Library

These UI components need to be designed and built:

**FeedCard** — Activity feed item with: actor avatar, verb, object, timestamp, action buttons (Read, Save, Share, Connect)

**ReputationBadge** — Compact badge showing verification + score in a ring

**PartnershipCard** — Recommended partner with: firm logo, match score, specializations, CTA

**CommunityCard** — Community with: icon, name, member count, recent activity, join CTA

**EventCard** — Event with: date, type, location, RSVP button, "Add to calendar" button

**MatchScore** — Circular progress showing 0–100 compatibility

**ProfileCard** — Hoverable card showing lawyer/firm summary on mouse-over of their name anywhere in the app

**FollowButton** — Follows a firm or lawyer, with follow/following state toggle

**ReferralBadge** — Small inline badge showing "47 referrals completed"

**OpportunityCard** — Job/opportunity listing with: type, firm, location, apply button

### 8.3 Typography Update

**Add** a new heading style for section labels in the sidebar:
```css
.sidebar-section-label {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding: 0.75rem 0.75rem 0.25rem;
}
```

### 8.4 Landing Page Update

The landing page (`/`) already has 15 sections. After launching the network features, add:
- Section 16: **"Build Your Network"** — showcasing the partnership and community features
- Update Section 3 "Who It's For" to mention networking for lawyers
- Update Section 12 stats: add "500+ Professional Connections Made"
- New testimonial angle: "Found our UK partner through LawBridge"

### 8.5 Micro-animations

**New interactions to design:**
- Follow button: heart-burst animation on click (professional, subtle)
- Partnership accepted: confetti-light burst (gold flecks)
- Reputation score: number counts up on profile load
- Feed item: subtle slide-in as new items appear
- Match score ring: draws itself on hover

---

## 9. Technical Implementation Plan

### 9.1 New Services Needed

**network-service** (new)
- Manages: follows, partnership requests, referrals, feed events, activity publishing
- DB: `network_db`
- Key models: `Follow`, `PartnershipRequest`, `Referral`, `FeedItem`
- Publishes to Redis: `network.partnership_accepted`, `network.referral_received`, `network.follow_new`

**community-service** (new)
- Manages: communities, threads, replies, membership, moderation
- DB: `community_db`
- Key models: `Community`, `Thread`, `Reply`, `Membership`

**event-service** (new or extend calendar-service)
- Manages: public events, RSVPs, event announcements
- Can extend existing `calendar-service` with public event models

**reputation-service** (new or extend lawyer-service)
- Aggregates reputation score from multiple services
- Scheduled job recalculates scores nightly
- Exposes `/api/v1/reputation/{lawyer_id}/` and `/api/v1/reputation/firms/{firm_id}/`

### 9.2 Existing Services — Extensions

**lawyer-service additions:**
- `BookmarkModel` — Save articles, books, lawyer profiles
- `AwardModel` — Add awards to lawyer profile
- `PublicFirmProfile` endpoint (public, SEO-friendly)
- International experience fields on lawyer profile

**auth-service additions:**
- Onboarding flow completion tracking
- Profile completeness score
- "Open to opportunities" flag

**search-service additions:**
- Index lawyer profiles with practice areas, reputation score, location
- Index firms with specializations, partnership status
- Index communities
- Add faceted search (filter by verified, practice area, location, availability)

**notification-service additions:**
- Network event notifications (partnership request, referral, follow)
- Weekly digest notification (profile views, network activity)
- Smart notification grouping (3 new followers → one notification)

**ai-assistant-service additions:**
- Partner recommendation endpoint (takes lawyer profile + available partners, returns scored matches)
- Judgment summary endpoint
- Feed personalization signals (what topics is this lawyer interested in?)

### 9.3 Frontend New Pages

| New Route | Description |
|---|---|
| `/lawyer/network/feed` | Activity feed |
| `/lawyer/network/discover/firms` | Firm discovery with filters |
| `/lawyer/network/discover/lawyers` | Lawyer discovery with filters |
| `/lawyer/network/partnerships` | My partnership requests (sent + received) |
| `/lawyer/network/referrals` | My referrals (sent + received) |
| `/lawyer/network/communities` | Community list + joined communities |
| `/lawyer/network/communities/[slug]` | Community detail + threads |
| `/lawyer/network/events` | Events list |
| `/lawyer/network/following` | Who I follow |
| `/lawyer/knowledge/judgments` | Judgments browser |
| `/lawyer/knowledge/bookmarks` | My saved items |
| `/lawyer/growth/analytics` | Upgraded analytics |
| `/lawyer/growth/opportunities` | Opportunities board |
| `/lawyer/growth/recruitment` | Recruitment posts |
| `/lawyer/growth/awards` | Awards management |
| `/firms/[slug]` | Public firm profile page |
| `/lawyers/[slug]` | Public lawyer profile page (enhanced) |
| `/marketplace` | Public legal marketplace (client-facing) |
| `/marketplace/[lawyerSlug]` | Individual marketplace listing |

### 9.4 Database Schema — Key New Tables

```sql
-- network-service

CREATE TABLE follows (
  id UUID PRIMARY KEY,
  follower_id UUID NOT NULL,       -- lawyer or firm
  follower_type VARCHAR(10),       -- 'lawyer' | 'firm'
  following_id UUID NOT NULL,
  following_type VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE partnership_requests (
  id UUID PRIMARY KEY,
  requesting_firm_id UUID NOT NULL,
  target_firm_id UUID NOT NULL,
  type VARCHAR(20),  -- 'co_counsel' | 'referral' | 'strategic' | 'international'
  status VARCHAR(15) DEFAULT 'pending',  -- pending | accepted | declined | counter
  message TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE referrals (
  id UUID PRIMARY KEY,
  referring_lawyer_id UUID,
  referring_firm_id UUID,
  receiving_lawyer_id UUID,
  receiving_firm_id UUID,
  client_id UUID,
  matter_summary TEXT,
  practice_area VARCHAR(100),
  status VARCHAR(15) DEFAULT 'pending',
  fee_percentage DECIMAL(5,2),
  created_at TIMESTAMPTZ
);

CREATE TABLE feed_items (
  id UUID PRIMARY KEY,
  actor_id UUID,
  actor_type VARCHAR(20),
  verb VARCHAR(50),     -- 'published' | 'seeking_partner' | 'hosting_event' | 'joined'
  object_id UUID,
  object_type VARCHAR(30),
  target_audience JSONB, -- {jurisdictions, practice_areas, firms}
  created_at TIMESTAMPTZ
);

-- community-service

CREATE TABLE communities (
  id UUID PRIMARY KEY,
  name VARCHAR(200),
  slug VARCHAR(200) UNIQUE,
  description TEXT,
  practice_areas JSONB,
  member_count INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT FALSE
);

CREATE TABLE community_threads (
  id UUID PRIMARY KEY,
  community_id UUID,
  author_id UUID,
  title VARCHAR(500),
  body TEXT,
  thread_type VARCHAR(20),  -- 'discussion' | 'question' | 'announcement'
  is_answered BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ
);

-- reputation score (denormalized for fast reads)

CREATE TABLE reputation_scores (
  lawyer_id UUID PRIMARY KEY,
  total_score INTEGER,
  verification_points INTEGER,
  practice_years_points INTEGER,
  publication_points INTEGER,
  partnership_points INTEGER,
  referral_points INTEGER,
  rating_points INTEGER,
  community_points INTEGER,
  activity_points INTEGER,
  last_calculated TIMESTAMPTZ
);
```

---

## 10. Implementation Roadmap

### Phase 0 — Foundation (Now, Weeks 1–2)
✅ Mobile sidebar responsive fix — DONE
✅ AI assistant mobile layout fix — DONE
- [ ] Sidebar navigation structure redesign (group by pillar)
- [ ] Dashboard redesign (greeting + recommendations placeholder)
- [ ] Lawyer profile page enhancement (reputation fields, availability status)
- [ ] Firm public profile page (`/firms/[slug]`)

### Phase 1 — Network Foundation (Weeks 3–6)
- [ ] `network-service` backend: Follow, Partnership Request, Referral models
- [ ] Partnership Request flow: send, receive, accept/decline
- [ ] Following system: follow firms and lawyers
- [ ] `/lawyer/network/partnerships` — Partnership requests page
- [ ] `/lawyer/network/referrals` — Referrals page
- [ ] Notification integration for network events
- [ ] Reputation score calculation (basic — verification + years + publications)
- [ ] ReputationBadge component on profile pages

### Phase 2 — Discovery & Feed (Weeks 7–10)
- [ ] Activity feed backend (FeedItem model, publisher endpoints)
- [ ] `/lawyer/network/feed` — Feed page with professional activity cards
- [ ] Dashboard redesign with recommendations + feed preview
- [ ] Enhanced discover pages with filters (verified, practice area, reputation)
- [ ] Partner recommendation API (AI-powered matching)
- [ ] Search service reindex with reputation scores
- [ ] PartnerCard and FeedCard UI components

### Phase 3 — Communities & Events (Weeks 11–14)
- [ ] `community-service` backend
- [ ] 8 initial communities seeded
- [ ] `/lawyer/network/communities` — Community browser
- [ ] `/lawyer/network/communities/[slug]` — Community threads
- [ ] Events (extend calendar-service with public events)
- [ ] `/lawyer/network/events` — Events page
- [ ] Community notifications

### Phase 4 — Knowledge Expansion (Weeks 15–18)
- [ ] Judgments section backend + seeding initial judgments
- [ ] `/lawyer/knowledge/judgments` — Judgments browser
- [ ] Bookmarks backend + UI
- [ ] AI judgment summaries
- [ ] OHADA curated section in library
- [ ] `/lawyer/knowledge/bookmarks` — Saved items

### Phase 5 — Growth Tools & Marketplace (Weeks 19–24)
- [ ] Analytics upgrade (beyond current reports)
- [ ] Firm public profile SEO optimization
- [ ] Recruitment board backend + UI
- [ ] Opportunities board
- [ ] Awards system
- [ ] Legal Marketplace (client-facing discovery + booking)
- [ ] International section on discover page
- [ ] Onboarding flow redesign (5-step first login)

### Phase 6 — Polish & Scale (Weeks 25–28)
- [ ] Mobile app (React Native wrapper — same API)
- [ ] Email digest (weekly professional summary)
- [ ] Landing page update (add network sections)
- [ ] SEO optimization for all public pages
- [ ] Performance optimization
- [ ] Load testing for network effects

---

## 11. AI Strategy

Per the meeting insight: AI is not the front door. The network is.

**What to keep doing:**
- LexAI Chat — high value, keep as-is
- Document Drafting — high value, keep as-is
- Contract Review — high value, keep as-is
- Legal Research with citations — high value, keep as-is
- Case Triage scoring — keep as-is

**What to add (targeted):**
- Partner recommendation algorithm (AI-powered compatibility scoring between firms)
- Judgment summaries (auto-generate when judgment is published)
- Feed personalization (what topics to show each lawyer)
- Document template pre-fill (detect matter type → suggest fields)

**What to delay:**
- Advanced automation workflows
- Predictive case outcome
- Contract auto-negotiation
- Client-facing AI
- Voice interfaces

**The principle:** AI should make existing features better, not become new features that distract from the network.

---

## 12. Team Message

> "We've validated our assumptions with a real law firm. They confirmed that practice management is useful, but they highlighted an even larger opportunity: professional networking and cross-border collaboration. We are not changing direction — we are expanding the vision.
>
> From today, LawBridge will be built on four pillars: Practice, Network, Knowledge, and Growth.
>
> Everything we've already built remains valuable and stays. Our next milestone is to integrate networking into the platform in a way that makes it indispensable to legal professionals. The practice management tools become the reason they trust us. The network becomes the reason they cannot leave.
>
> In six months, when a managing partner says: 'LawBridge is the easiest place to find trusted legal partners across Cameroon and Africa, and it also helps us manage our practice' — we will have built something with a clear, defensible identity."

---

## Appendix A — Quick Comparison Table

| Area | Current System | New System |
|---|---|---|
| Navigation | Technical function list | Four business pillars |
| Dashboard | KPIs and case list | Greeting + recommendations + feed |
| Discovery | Basic search pages | AI-matched, filtered, reputation-ranked |
| Networking | Not present | Core pillar (Feed, Partners, Referrals, Communities) |
| Profile | Basic info | Full reputation profile with score |
| Library | 26 books + articles | + Judgments + OHADA curated + Bookmarks |
| Reports | Basic monitoring | Growth analytics + team utilization |
| AI | 5-tab assistant | + Partner recommendations + Judgment summaries |
| International | Not present | Dedicated section in Discovery |
| Marketplace | Not present | Public client-facing discovery + booking |

## Appendix B — The Single Metric That Matters

In Phase 1-2, track one number above all others:

**Number of partnership requests sent per week.**

If that number is growing, the ecosystem is working. Everything else follows.

---

*Document prepared by Claude Code on behalf of the LawBridge product team.*
*July 2026 — Confidential. Not for external distribution.*
