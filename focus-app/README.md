# Focus App

A Today-first personal execution system built around one idea: **reduce cognitive load by protecting attention**.

> You don't manage your tasks. You manage your attention.

## Current MVP

- React + Vite frontend
- Today-first home screen
- Commitments vs. suggestions mental model
- Add and complete today's actions
- Focus-mode entry point
- Time/energy-aware `What now?` interaction
- Optional Supabase client wiring
- Local mode works without backend credentials

## Product loop

`CAPTURE → STRUCTURE → GOAL/PROJECT/TASK → RESOURCE → PLAN TODAY → WHAT NOW? → FOCUS → REALITY → REVIEW → REPLAN`

AI is intentionally secondary. It interprets, suggests and helps re-plan; the user decides.

## Supabase

The app uses Supabase for authentication and PostgreSQL persistence. The initial schema is designed around:

- `profiles`
- `inbox_items`
- `goals`
- `projects`
- `resources`
- `tasks`
- `daily_plans`
- `daily_plan_tasks`
- `focus_sessions`
- `daily_reviews`

Row Level Security is enabled so records are scoped to the authenticated user.

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

Focus mode protects attention around one action. The timer is a tool, not a productivity ideology.

### Review / replan

The system should record what actually happened and treat interruptions, bad estimates, ambiguity and changing priorities as information. Reality beats the original plan.

## Roadmap

1. Connect auth and persistent Today data
2. Build Inbox / brain dump flow
3. Build Goals and Projects
4. Add resources and progress tracking
5. Build Focus sessions and daily review
6. Add emergency-task replanning
7. Add optional AI interpretation and re-planning
8. Deploy and use the app continuously before adding complexity
