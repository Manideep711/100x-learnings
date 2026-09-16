# Focus App

A Today-first personal execution system built around one idea: **reduce cognitive load by protecting attention**.

> You don't manage your tasks. You manage your attention.

## Current MVP

- React 19 + Vite
- Today-first home screen
- Commitments vs. suggestions mental model
- Google OAuth wiring through Supabase Auth
- Persistent Today tasks for signed-in users
- Add and complete today's actions
- Focus mode with a 25-minute timer
- Focus sessions persisted to PostgreSQL
- Time/energy-aware `What now?` interaction
- Local fallback when Supabase credentials are absent

## Product loop

`CAPTURE → STRUCTURE → GOAL/PROJECT/TASK → RESOURCE → PLAN TODAY → WHAT NOW? → FOCUS → REALITY → REVIEW → REPLAN`

AI is intentionally secondary. It interprets, suggests and helps re-plan; the user decides.

## Supabase architecture

The MVP uses PostgreSQL + Supabase Auth with these core tables:

- `goals` — outcomes the user cares about
- `projects` — larger bodies of work attached to goals
- `resources` — courses, docs, books, videos, projects, etc.
- `tasks` — concrete actions and Today commitments
- `brain_dumps` — raw thoughts waiting to be processed
- `daily_plans` — available time, energy and notes for a day
- `focus_sessions` — actual focus history

Every table has a `user_id` foreign key to `auth.users`, and Row Level Security is enabled. Policies use the authenticated user's ID so one account cannot read or modify another account's rows.

The canonical schema is versioned at `supabase/migrations/20260916164006_create_focus_app_core.sql`. The live Supabase project also has a follow-up hardening migration that optimizes RLS evaluation and adds foreign-key indexes.

### GraphQL advisor warnings

Supabase's security advisor may report these tables as exposed in the GraphQL schema. The app is built around the normal Supabase client/PostgREST path, not GraphQL, and the tables remain protected by RLS. Removing `SELECT` from `authenticated` would interfere with the app's normal data access, so these GraphQL visibility warnings are intentionally documented rather than masking them by breaking the MVP.

### Environment

Create `focus-app/.env.local` from `.env.example`:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never commit `.env.local`, service-role keys, database passwords, or other secrets. The browser should only receive the publishable key.

### Auth

The first UI integration uses Google OAuth. In Supabase Auth, configure Google and add the local/deployed app URL to the allowed redirect URLs before testing sign-in.

## Run locally

```bash
cd focus-app
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Architecture notes

### Inbox

A frictionless place for messy thoughts. Not every thought becomes a task. AI should show its interpretation and let the user confirm/edit it.

### Goals and projects

Goals represent outcomes the user cares about. Projects are larger bodies of work attached to outcomes. Active means the user is currently committing attention to it; Later means intentionally not active.

### Resources

Resources describe how the user chooses to learn or accomplish something: courses, documentation, videos, books, projects, etc. A resource is separate from the goal it supports.

### Today

Adding an item to Today is a commitment for that day. Suggestions are deliberately non-binding. The interface should avoid guilt-driven overdue states.

### Focus

Focus mode protects attention around one action. The timer is a tool, not a productivity ideology. Completed focus sessions record actual time and outcome.

### Review / replan

The system should record what actually happened and treat interruptions, bad estimates, ambiguity and changing priorities as information. Reality beats the original plan.

## Roadmap

1. Connect auth and persistent Today data ✅
2. Build Inbox / brain dump flow
3. Build Goals and Projects
4. Add resources and progress tracking
5. Expand Focus sessions and daily review
6. Add emergency-task replanning
7. Add optional AI interpretation and re-planning
8. Deploy and use the app continuously before adding complexity
