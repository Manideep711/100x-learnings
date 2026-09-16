create extension if not exists pgcrypto;

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  why text,
  status text not null default 'active' check (status in ('active','later','completed','paused','archived')),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null,
  outcome text,
  status text not null default 'active' check (status in ('active','completed','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  type text not null default 'other' check (type in ('course','docs','book','video','project','other')),
  url text,
  progress_current integer not null default 0 check (progress_current >= 0),
  progress_total integer check (progress_total is null or progress_total > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  resource_id uuid references public.resources(id) on delete set null,
  title text not null,
  status text not null default 'inbox' check (status in ('inbox','today','in_progress','done','later','archived')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  is_emergency boolean not null default false,
  scheduled_for timestamptz,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brain_dumps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  available_minutes integer check (available_minutes is null or available_minutes >= 0),
  energy text check (energy is null or energy in ('low','medium','high')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  planned_minutes integer check (planned_minutes is null or planned_minutes > 0),
  actual_minutes integer check (actual_minutes is null or actual_minutes >= 0),
  outcome text check (outcome is null or outcome in ('completed','partial','stopped')),
  note text
);

create index goals_user_id_idx on public.goals(user_id);
create index projects_user_id_idx on public.projects(user_id);
create index projects_goal_id_idx on public.projects(goal_id);
create index resources_user_id_idx on public.resources(user_id);
create index resources_goal_id_idx on public.resources(goal_id);
create index resources_project_id_idx on public.resources(project_id);
create index tasks_user_status_idx on public.tasks(user_id, status);
create index tasks_user_scheduled_idx on public.tasks(user_id, scheduled_for);
create index tasks_goal_id_idx on public.tasks(goal_id);
create index tasks_project_id_idx on public.tasks(project_id);
create index tasks_resource_id_idx on public.tasks(resource_id);
create index brain_dumps_user_processed_idx on public.brain_dumps(user_id, processed);
create index focus_sessions_user_started_idx on public.focus_sessions(user_id, started_at);
create index focus_sessions_task_id_idx on public.focus_sessions(task_id);

alter table public.goals enable row level security;
alter table public.projects enable row level security;
alter table public.resources enable row level security;
alter table public.tasks enable row level security;
alter table public.brain_dumps enable row level security;
alter table public.daily_plans enable row level security;
alter table public.focus_sessions enable row level security;

create policy "users manage own goals" on public.goals for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage own projects" on public.projects for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage own resources" on public.resources for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage own tasks" on public.tasks for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage own brain dumps" on public.brain_dumps for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage own daily plans" on public.daily_plans for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users manage own focus sessions" on public.focus_sessions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
