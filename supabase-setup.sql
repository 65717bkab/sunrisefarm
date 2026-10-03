create table animals(
  id uuid primary key default gen_random_uuid(),
  type text not null, name text not null, breed text, age text,
  price numeric default 0, description text, image_url text,
  status text default 'available', created_at timestamptz default now());
create table enquiries(
  id uuid primary key default gen_random_uuid(),
  name text, phone text, animal_id text, animal_name text, message text,
  status text default 'new', created_at timestamptz default now());
alter table animals enable row level security;
alter table enquiries enable row level security;
create policy "public read animals" on animals for select using (true);
create policy "admin manage animals" on animals for all to authenticated using (true) with check (true);
create policy "public send enquiry" on enquiries for insert with check (true);
create policy "admin manage enquiries" on enquiries for all to authenticated using (true) with check (true);

-- photos
insert into storage.buckets(id,name,public) values('animals','animals',true) on conflict do nothing;
create policy "public read photos" on storage.objects for select using (bucket_id='animals');
create policy "admin manage photos" on storage.objects for all to authenticated using (bucket_id='animals') with check (bucket_id='animals');
-- M-Pesa payments
create table payments(id uuid primary key default gen_random_uuid(), checkout_id text, phone text, amount numeric, animal_name text, status text default 'pending', result text, created_at timestamptz default now());
alter table payments enable row level security;
create policy "admin read payments" on payments for select to authenticated using (true);
