-- FILE UNDER MYSTERY Master DB Schema
create extension if not exists "uuid-ossp";

create table if not exists teams (
    id uuid primary key default gen_random_uuid(),
    team_name text unique not null,
    captain_email text unique not null,
    total_points int default 0,
    created_at timestamptz default now()
);

create table if not exists levels (
    id text primary key,
    level_order int not null,
    base_points int not null,
    correct_hash text not null
);

create table if not exists progress (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references teams(id) on delete cascade,
    level_id text references levels(id),
    solved boolean default false,
    solved_at timestamptz,
    attempts int default 0,
    points_awarded int default 0,
    unique(team_id, level_id)
);

create table if not exists hint_reveals (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references teams(id) on delete cascade,
    level_id text references levels(id),
    hint_index int not null,
    points_deducted int not null,
    revealed_at timestamptz default now(),
    unique(team_id, level_id, hint_index)
);
