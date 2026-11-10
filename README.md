# InfluenceConnect

A web platform that helps **Influencers** connect with **Companies** for paid collaborations.

Supported platforms: **Instagram, TikTok, Facebook, LinkedIn**  
Platform fee: **5%** on every paid deal.

## Tech Stack

- React + Vite
- Tailwind CSS
- Supabase (Auth + Database)
- React Router

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/rbox810-coder/influence-connect.git
cd influence-connect
npm install
```

### 2. Create a Supabase project
1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. Go to **Project Settings → API** and copy:
   - Project URL
   - anon public key

### 3. Create `.env` file
Create a file named `.env` in the root folder:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Run the Database Schema
Go to **Supabase → SQL Editor** and run the following SQL:

```sql
-- Create profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text check (role in ('influencer', 'company')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Influencer specific profile
create table public.influencer_profiles (
  id uuid references public.profiles on delete cascade primary key,
  bio text,
  niche text[],
  location text,
  facebook_url text,
  facebook_followers integer default 0,
  instagram_url text,
  instagram_followers integer default 0,
  tiktok_url text,
  tiktok_followers integer default 0,
  linkedin_url text,
  linkedin_followers integer default 0,
  rate_per_post numeric,
  portfolio_links text[]
);

-- Company specific profile
create table public.company_profiles (
  id uuid references public.profiles on delete cascade primary key,
  company_name text,
  website text,
  industry text,
  description text,
  location text
);

-- Campaigns table
create table public.campaigns (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.profiles on delete cascade,
  title text not null,
  description text,
  budget numeric,
  platforms text[],
  niche text[],
  status text default 'open' check (status in ('open', 'closed', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.influencer_profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.campaigns enable row level security;

-- Basic Policies
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
```

### 5. Start the app
```bash
npm run dev
```

Open http://localhost:5173

## Current Features (Phase 1)
- User authentication (Signup / Login)
- Role selection (Influencer or Company)
- Basic dashboard
- Clean modern UI

## Next Phases
- Complete influencer & company profiles
- Campaign creation & browsing
- Applications system
- Messaging
- Deal creation + 5% commission logic
- Stripe payments

---

Built with ❤️ using Grok