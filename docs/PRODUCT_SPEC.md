# Chore Wars — Product Spec, Gamification & Roadmap

> A lightweight, living product & technical spec for **Chore Wars** — capturing the vision, unified multi-Fort identity model, gamification loop, Promotion Ceremony hook, monetization path, and phased build plan.

---

## 1. Vision & Core Concept

**Chore Wars** turns household chores into an RPG-inspired competition inside shared **Forts** (households).

A **Commander in Chief (CoCh)** sets up a Fort in under a minute using a quick home wizard (house type, bedrooms, bathrooms, kitchen, yard, pets). Users aren't locked to a single home: a user can own zero, one, or many Forts, join relatives' or roommates' Forts (e.g., visiting Grandpa's Fort for a month), and supervise kid accounts with full guardian control.

Everyone competes as **Characters** earning **XP** by completing chores—assigned or up for grabs. XP drives two fair tracks: global **Career XP** (lifelong Hero Rank & `T1 → T2 → T3+` armor evolution across all Forts) and per-Fort **Fort XP** (that Fort's Leaderboard & Goal Rewards). Physical **NFC tags** and printable **QR stickers** make starting and finishing chores a 2-second tap—backed by a compact **2-column Quick Menu** for tag-free use.

---

## 2. Unified Users, Supervised Accounts & Fort Roles

Every person in Chore Wars is a **User** (`users` table):

- **Full Account:** Has `email` + `password_hash`, `guardian_user_id = NULL`, and an optional 4-digit **Guardian PIN** (`guardian_pin_hash`) shared across all their Forts and used to protect kid-locked shared devices. Can create any number of Forts, join/leave Forts freely, serve as CoCh (including multiple CoChs per Fort), and supervise child accounts.
- **Supervised Account (Kids):** Created by a parent/guardian (`guardian_user_id = <parent.id>`, no email/password required).
  - Switches Netflix-style on the guardian's phone/tablet, or binds to a dedicated kid device via **Device Lock** (requires Guardian PIN to unlock).
  - Cannot accept invites or join/leave Forts independently—the **Guardian approves invitations and can revoke/retire the kid from any Fort in 1 tap anytime**.
  - **Graduation Path:** When older, a supervised account can add an email + password onto the *same* `user.id`, keeping their entire Career XP, Rank, Armor, and Fort memberships.

### Per-Fort Membership Roles (`fort_memberships`)

| Role | Who can hold it | Capabilities within that Fort |
| :--- | :--- | :--- |
| **Commander in Chief (CoCh)** | Full Accounts only *(multiple CoChs allowed per Fort)* | Manages areas, tasks, XP, rules, rewards/bounties, invites/removes members, promotes roles, resets any task, and approves chores. Also competes in the war! |
| **Reviewer** | Full or Supervised Accounts *(e.g., older siblings)* | Designated by a CoCh to approve/reject photo-verified chores so one parent isn't a bottleneck. |
| **Recruit** | Any User | Claims, starts, finishes, and can undo/restart their own completed chores during the cooldown window; tracks Career Rank and Fort progress. |

### Guardrails
- **Last-CoCh Protection:** The last remaining CoCh cannot leave an active Fort orphaned—they must promote another full-account member to CoCh or archive the Fort.
- **Kid-Safe Invitations:** No public user directory. CoChs invite via **Direct Email Invite** (sent to an adult/guardian who chooses whether to accept for themselves and/or their supervised kids) or a revocable **6-character Fort Invite Code**.

---

## 3. Core Building Blocks

### 3.1 Smart Home Setup Wizard
Onboarding asks quick taps (Home Type, bedrooms, bathrooms, kitchen, yard, pets) and auto-generates Areas, Tasks (including **area-less General tasks**), sensible XP defaults, and honor-system validation—all editable anytime.

### 3.2 Tasks, Cooldowns, Undo & Validation
- **Assignment:** *Open ("Up for Grabs")* or *Assigned* to a specific member.
- **Recurrence / Cooldown Presets:** *Daily*, *Every X Days after completion*, *Weekly*, *Monthly*, *One-Off*, and *On-Demand / Anytime* (no cooldown—ideal for as-needed chores like spills, dog poop, or toddler-friendly helper missions).
- **Anti-Squatting Timeout:** Started tasks auto-release after 90 minutes if abandoned.
- **Undo / Restart:** A player can undo their own completed chore anytime during its cooldown window (safely reverting both `career_xp` and `fort_xp` so it cannot be farmed); CoCh can reset/edit any task in place anytime.
- **Validation Modes:**
  - **Honor System *(Default & Phase 1)*:** Instant XP when marked complete.
  - **Photo Proof *(Phase 2 — opt-in per task)*:** Completing opens the in-app camera + optional comment. **No XP is granted until approved** by a CoCh or Reviewer—enabling both quick push-notification approvals *and* family **Promotion Ceremonies**!
  - **Strict / Competitive Review Grading *(Phase 2/3 — opt-in per Fort)*:** Strict or competitive Forts can optionally let CoCh/Reviewers assign a quality grade on reviewed tasks (e.g., 1–3 stars or 75% / 100% / 125% spotless bonus), dynamically scaling `task_runs.xp_awarded`.

### 3.3 Gamification, Dual XP & Promotion Ceremonies
1. **Dual XP System:**
   - **Career XP (`users.career_xp`):** Global lifelong XP powering the **Infinite Rank Ladder** (weekly rank-ups up to *Ultra Mega Hyper God of Bubbles* + infinite Prestige `★`) and automatic **`T1 → T2 → T3+` Hero Portrait Evolutions**.
   - **Fort XP (`fort_memberships.fort_xp`):** Scoped to each Fort for fair **Leaderboards**, **Goal Rewards** (with optional IRL prizes & participant exclusions), and future monthly seasons / Bounty Pools.
2. **Daily & Weekly Promotion Ceremony *(Later Phase — High-Retention Hook)*:**
   - Parents gather the family for a quick daily check-in or bigger weekend **Ceremony Screen**: pending approvals reveal one-by-one with animated XP fills, **RANK UP!** fanfare, and dramatic **`T1 → T2 → T3` Armor Evolution** reveals so kids show off their progress together.
3. **RPG Cartoon Hero Generator & Companion "Family Character Studio" *(Later Phase)*:**
   - Privacy-first **Snap & Shred** (selfie processed in-memory, never stored) or No-Photo Hero Builder → Cartoon-only upgrades forever.
   - **Portable Character Pack Companion App:** A standalone *"Build Your Family"* studio app that generates custom family cartoon characters + `t1/t2/t3+` evolutions and exports a portable character pack (manifest + PNGs, synced to cloud storage on import) usable across **Chore Wars** and future companion apps (plus fun standalone exports like WhatsApp/printable stickers).

---

## 4. Education / Parent Playbook Department *(Later Phase)*

Beyond the app UI and Art Department (`chorewars-art`), an **Education / Playbook** track produces bite-sized video & visual guides:
- **App How-Tos:** 30-second clips for setting up a Fort, programming NFC/QR stickers, inviting grandparents, and managing supervised kids.
- **Family Engagement Playbooks ("How to Juice Chore Wars"):** Coaching parents on running a 2-minute daily check-in, hosting an exciting weekend **Promotion Ceremony**, framing fun non-cash Goal Rewards, and keeping kids intrinsically motivated.

---

## 5. Future Monetization & Privacy-First Data Strategy

1. **Physical Tag Packs:** Custom-illustrated Chore Wars NFC + QR sticker packs matching our art style.
2. **Contextual CPG Brand Sponsorships (Adult CoCh Only):** Helpful area-based tips surfaced strictly to adult CoCh users based on person-agnostic household cleaning frequency (e.g., *"Clean less often with a dust-repelling surface spray"*).
3. **Person-Agnostic Household Habit Analytics:** Canonical `category_key` on Areas & Tasks + Fort cohort counts (`home_type`, rooms, pets, adult/kid counts) + `duration_seconds`—100% decoupled from child PII (COPPA / GDPR-K / Apple Kids safe).
4. **Optional Low-Cost Fort Pass:** Unlocks AI 2-try photo inspections, extra ceremony themes, and custom cartoon evolutions.
5. **Asset & Media Storage Cost Strategy:**
   - **Bundled Default Art ($0 bandwidth):** Keep starter character portraits, task illustrations, and wallpaper bundled directly inside the app (`assets/images/`).
   - **User-Generated Media (Proof Photos & Custom Character Packs):** Store binary images in object storage and save only HTTPS URLs in Postgres. Prefer **Cloudflare R2** (S3-compatible, 10 GB free tier, **$0 egress fees**—avoiding AWS S3 download bandwidth costs as family photo traffic grows) or **Vercel Blob** for quick early prototyping.

---

## 6. Phased Roadmap

| Phase | Focus | Key Deliverables |
| :--- | :--- | :--- |
| **Phase 0** *(Done)* | Foundation & Live Deploy | Expo SDK 58 + Expo Router + TypeScript, preserved logo, `/api/health` live on Vercel. |
| **Phase 1A** *(Done)* | Initial MVP & Art Pipeline | Neon + Drizzle, Home Wizard, 2-column Battle Board, Scoreboard, tiled wallpaper, infinite Rank Ladder, 26 promoted art assets + visual `CharacterPicker`. |
| **Phase 1B** *(In Progress)* | Unified Multi-Fort Architecture & Full CRUD | Unified `users` (Full + Supervised), `fort_memberships` (multiple CoChs + dual XP), `fort_invitations` (email + invite codes + guardian approval/revoke), **Profile Tab**, **Multi-Fort Switcher**, Battle Board Undone-first/Undo/Edit-in-Place, and **Fort Command Tabbed CRUD**. |
| **Phase 2** | Photo Proof, Reviewers, QR & Bounty Pool | `expo-camera` proof + cloud storage, CoCh/Reviewer side-by-side queue (XP granted on approval), printable QR stickers (`/t/<tagId>`), Monthly Prorated Bounty Pool. |
| **Phase 3** | NFC Tags, Push Notifications & Ceremony Mode | Expo Dev Build (`eas build --profile development`), in-app NFC writing/reading, actionable push notifications, animated **Daily/Weekly Promotion Ceremony** screen. |
| **Phase 4** | AI Inspector, Cartoon Generator, Education & Launch | 2-try Vision AI photo coaching, Snap & Shred cartoon generator, Education / Parent Playbook videos, NFC/QR tag pack store, adult CoCh CPG tips, App Store / Google Play launch. |

---

## 7. Unified Phase 1B Database Schema (Neon Postgres + Drizzle)

- `users` — Full & Supervised accounts (`id`, `email` nullable unique, `password_hash` nullable, `guardian_user_id` nullable self-FK, `guardian_pin_hash` nullable, `name`, `is_adult`, `avatar_key`, `avatar_url` nullable, `career_xp`, `created_at`)
- `forts` — Households (`id`, `created_by_user_id`, `name`, `home_type`, `bedroom_count`, `bathroom_count`, `has_kitchen`, `has_yard`, `has_pets`, `invite_code` unique, `is_archived`, `created_at`)
- `fort_memberships` — Many-to-Many bridge (`id`, `fort_id`, `user_id`, `role`: `'coch' | 'reviewer' | 'recruit'`, `fort_xp`, `joined_at`, `left_at` nullable)
- `fort_invitations` — Direct email invites (`id`, `fort_id`, `invited_by_user_id`, `target_email`, `role`, `note`, `status`, `created_at`, `responded_at`)
- `areas` — Zones (`id`, `fort_id`, `name`, `category_key`, `icon_key`, `default_xp`, `sort_order`, `created_at`)
- `tasks` — Chores (`id`, `fort_id`, `area_id` nullable, `title`, `category_key`, `xp`, `recurrence_type`, `cooldown_days`, `validation_mode`, `assigned_user_id` nullable, `is_active`, `created_at`)
- `task_runs` — Chore runs (`id`, `task_id`, `fort_id`, `user_id`, `status`: `'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'expired' | 'undone'`, `started_at`, `completed_at`, `duration_seconds`, `expires_at`, `xp_awarded`, `comment`, `proof_photo_url`)
- `rewards` — Goals & Bounties (`id`, `fort_id`, `title` nullable, `type`, `target_xp`, `pool_amount_cents` nullable, `excluded_user_ids`, `is_active`, `created_at`)
