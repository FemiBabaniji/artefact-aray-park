-- Migration: Community mock data for AI search
-- Seeds test community with founders, artefacts, rooms, and blocks
-- Depends on 012_block_types.sql for new enum values

-- ═══════════════════════════════════════════════════════════════════════════
-- Create test community if not exists
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO communities (id, slug, name, tagline, accent_color, tier)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'bfn-winter-2025',
  'Black Founders Network',
  'Winter 2025 Cohort',
  '#3b4f42',
  'pro'
)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Create program for the community
INSERT INTO programs (id, community_id, name, subtitle, week, total_weeks, live)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Founder Journey',
  'Building investor-ready startups',
  8,
  20,
  true
)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- Insert mock members
-- ═══════════════════════════════════════════════════════════════════════════

-- Kwame Mensah / PathWAI
INSERT INTO members (id, community_id, name, initials, title, email, location, color, stage)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Kwame Mensah',
  'KM',
  'Founder & CEO',
  'kwame@pathwai.com',
  'Atlanta, GA',
  '#4f6d7a',
  'development'
)
ON CONFLICT (community_id, email) DO UPDATE SET name = EXCLUDED.name;

-- Tiana Grant / FinBridge
INSERT INTO members (id, community_id, name, initials, title, email, location, color, stage)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Tiana Grant',
  'TG',
  'CEO',
  'tiana@finbridge.io',
  'Chicago, IL',
  '#7a4f6d',
  'foundation'
)
ON CONFLICT (community_id, email) DO UPDATE SET name = EXCLUDED.name;

-- Marcus Lewis / AgriOS
INSERT INTO members (id, community_id, name, initials, title, email, location, color, stage)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Marcus Lewis',
  'ML',
  'Founder',
  'marcus@agrios.tech',
  'Houston, TX',
  '#6d7a4f',
  'showcase'
)
ON CONFLICT (community_id, email) DO UPDATE SET name = EXCLUDED.name;

-- Fatima Ahmed / SolarLoop
INSERT INTO members (id, community_id, name, initials, title, email, location, color, stage)
VALUES (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Fatima Ahmed',
  'FA',
  'Co-founder',
  'fatima@solarloop.co',
  'Oakland, CA',
  '#4f7a6d',
  'development'
)
ON CONFLICT (community_id, email) DO UPDATE SET name = EXCLUDED.name;

-- Jordan Taylor / HealthStack
INSERT INTO members (id, community_id, name, initials, title, email, location, color, stage)
VALUES (
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Jordan Taylor',
  'JT',
  'Founder',
  'jordan@healthstack.io',
  'Brooklyn, NY',
  '#6d4f7a',
  'entry'
)
ON CONFLICT (community_id, email) DO UPDATE SET name = EXCLUDED.name;

-- Devon Brown / LogiSync
INSERT INTO members (id, community_id, name, initials, title, email, location, color, stage)
VALUES (
  '10000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'Devon Brown',
  'DB',
  'CEO',
  'devon@logisync.com',
  'Dallas, TX',
  '#7a6d4f',
  'foundation'
)
ON CONFLICT (community_id, email) DO UPDATE SET name = EXCLUDED.name;

-- ═══════════════════════════════════════════════════════════════════════════
-- Create artefacts for each member
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO artefacts (id, member_id, ws_content, updated_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '', now()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '', now()),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '', now()),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '', now()),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '', now()),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', '', now())
ON CONFLICT (member_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- Create rooms for each artefact
-- ═══════════════════════════════════════════════════════════════════════════

-- Kwame's rooms
INSERT INTO rooms (id, artefact_id, key, label, pace, status, order_index, is_public) VALUES
  ('30000001-0001-0001-0001-000000000001', '20000000-0000-0000-0000-000000000001', 'identity', 'Identity', 'foundation', 'complete', 0, true),
  ('30000001-0001-0001-0001-000000000002', '20000000-0000-0000-0000-000000000001', 'startup', 'Startup', 'foundation', 'complete', 1, true),
  ('30000001-0001-0001-0001-000000000003', '20000000-0000-0000-0000-000000000001', 'pitch', 'Pitch', 'development', 'active', 2, true),
  ('30000001-0001-0001-0001-000000000004', '20000000-0000-0000-0000-000000000001', 'traction', 'Traction', 'development', 'complete', 3, true),
  ('30000001-0001-0001-0001-000000000005', '20000000-0000-0000-0000-000000000001', 'documents', 'Documents', 'ongoing', 'complete', 4, false)
ON CONFLICT (artefact_id, key) DO UPDATE SET status = EXCLUDED.status;

-- Tiana's rooms
INSERT INTO rooms (id, artefact_id, key, label, pace, status, order_index, is_public) VALUES
  ('30000002-0001-0001-0001-000000000001', '20000000-0000-0000-0000-000000000002', 'identity', 'Identity', 'foundation', 'complete', 0, true),
  ('30000002-0001-0001-0001-000000000002', '20000000-0000-0000-0000-000000000002', 'startup', 'Startup', 'foundation', 'complete', 1, true),
  ('30000002-0001-0001-0001-000000000003', '20000000-0000-0000-0000-000000000002', 'pitch', 'Pitch', 'development', 'empty', 2, true),
  ('30000002-0001-0001-0001-000000000004', '20000000-0000-0000-0000-000000000002', 'traction', 'Traction', 'development', 'active', 3, true),
  ('30000002-0001-0001-0001-000000000005', '20000000-0000-0000-0000-000000000002', 'documents', 'Documents', 'ongoing', 'empty', 4, false)
ON CONFLICT (artefact_id, key) DO UPDATE SET status = EXCLUDED.status;

-- Marcus's rooms (showcase - all complete)
INSERT INTO rooms (id, artefact_id, key, label, pace, status, order_index, is_public) VALUES
  ('30000003-0001-0001-0001-000000000001', '20000000-0000-0000-0000-000000000003', 'identity', 'Identity', 'foundation', 'complete', 0, true),
  ('30000003-0001-0001-0001-000000000002', '20000000-0000-0000-0000-000000000003', 'startup', 'Startup', 'foundation', 'complete', 1, true),
  ('30000003-0001-0001-0001-000000000003', '20000000-0000-0000-0000-000000000003', 'pitch', 'Pitch', 'development', 'complete', 2, true),
  ('30000003-0001-0001-0001-000000000004', '20000000-0000-0000-0000-000000000003', 'traction', 'Traction', 'development', 'complete', 3, true),
  ('30000003-0001-0001-0001-000000000005', '20000000-0000-0000-0000-000000000003', 'documents', 'Documents', 'ongoing', 'active', 4, false)
ON CONFLICT (artefact_id, key) DO UPDATE SET status = EXCLUDED.status;

-- Fatima's rooms
INSERT INTO rooms (id, artefact_id, key, label, pace, status, order_index, is_public) VALUES
  ('30000004-0001-0001-0001-000000000001', '20000000-0000-0000-0000-000000000004', 'identity', 'Identity', 'foundation', 'complete', 0, true),
  ('30000004-0001-0001-0001-000000000002', '20000000-0000-0000-0000-000000000004', 'startup', 'Startup', 'foundation', 'complete', 1, true),
  ('30000004-0001-0001-0001-000000000003', '20000000-0000-0000-0000-000000000004', 'pitch', 'Pitch', 'development', 'active', 2, true),
  ('30000004-0001-0001-0001-000000000004', '20000000-0000-0000-0000-000000000004', 'traction', 'Traction', 'development', 'complete', 3, true),
  ('30000004-0001-0001-0001-000000000005', '20000000-0000-0000-0000-000000000004', 'documents', 'Documents', 'ongoing', 'complete', 4, false)
ON CONFLICT (artefact_id, key) DO UPDATE SET status = EXCLUDED.status;

-- Jordan's rooms (entry - mostly empty)
INSERT INTO rooms (id, artefact_id, key, label, pace, status, order_index, is_public) VALUES
  ('30000005-0001-0001-0001-000000000001', '20000000-0000-0000-0000-000000000005', 'identity', 'Identity', 'foundation', 'active', 0, true),
  ('30000005-0001-0001-0001-000000000002', '20000000-0000-0000-0000-000000000005', 'startup', 'Startup', 'foundation', 'empty', 1, true),
  ('30000005-0001-0001-0001-000000000003', '20000000-0000-0000-0000-000000000005', 'pitch', 'Pitch', 'development', 'empty', 2, true),
  ('30000005-0001-0001-0001-000000000004', '20000000-0000-0000-0000-000000000005', 'traction', 'Traction', 'development', 'empty', 3, true),
  ('30000005-0001-0001-0001-000000000005', '20000000-0000-0000-0000-000000000005', 'documents', 'Documents', 'ongoing', 'empty', 4, false)
ON CONFLICT (artefact_id, key) DO UPDATE SET status = EXCLUDED.status;

-- Devon's rooms
INSERT INTO rooms (id, artefact_id, key, label, pace, status, order_index, is_public) VALUES
  ('30000006-0001-0001-0001-000000000001', '20000000-0000-0000-0000-000000000006', 'identity', 'Identity', 'foundation', 'complete', 0, true),
  ('30000006-0001-0001-0001-000000000002', '20000000-0000-0000-0000-000000000006', 'startup', 'Startup', 'foundation', 'complete', 1, true),
  ('30000006-0001-0001-0001-000000000003', '20000000-0000-0000-0000-000000000006', 'pitch', 'Pitch', 'development', 'active', 2, true),
  ('30000006-0001-0001-0001-000000000004', '20000000-0000-0000-0000-000000000006', 'traction', 'Traction', 'development', 'complete', 3, true),
  ('30000006-0001-0001-0001-000000000005', '20000000-0000-0000-0000-000000000006', 'documents', 'Documents', 'ongoing', 'empty', 4, false)
ON CONFLICT (artefact_id, key) DO UPDATE SET status = EXCLUDED.status;

-- ═══════════════════════════════════════════════════════════════════════════
-- Insert room blocks (content)
-- ═══════════════════════════════════════════════════════════════════════════

-- Kwame's Identity blocks
INSERT INTO room_blocks (room_id, block_type, content, metadata, order_index) VALUES
  ('30000001-0001-0001-0001-000000000001', 'text', 'First-generation college grad turned founder. I spent 4 years at Google building ML systems before realizing the career guidance gap for people like me.', '{}', 0),
  ('30000001-0001-0001-0001-000000000001', 'skill', '', '{"name": "Machine Learning", "level": "expert", "years": 6, "category": "Technical"}', 1),
  ('30000001-0001-0001-0001-000000000001', 'skill', '', '{"name": "Product Management", "level": "advanced", "years": 3, "category": "Leadership"}', 2),
  ('30000001-0001-0001-0001-000000000001', 'experience', '', '{"title": "ML Engineer", "organization": "Google", "location": "Mountain View, CA", "startDate": "2020-06", "endDate": "2024-01", "description": "Built recommendation systems for YouTube Learning", "highlights": ["Led team of 4 engineers", "Shipped features to 100M+ users"], "skills": ["TensorFlow", "Python", "GCP"]}', 3),
  ('30000001-0001-0001-0001-000000000001', 'education', '', '{"institution": "Stanford University", "degree": "B.S.", "field": "Computer Science", "startDate": "2016", "endDate": "2020", "highlights": ["AI concentration", "Deans List"]}', 4)
ON CONFLICT DO NOTHING;

-- Kwame's Startup blocks
INSERT INTO room_blocks (room_id, block_type, content, metadata, order_index) VALUES
  ('30000001-0001-0001-0001-000000000002', 'project', '', '{"title": "PathWAI", "description": "AI-powered career coach that provides personalized guidance to first-generation professionals. We match users with mentors, surface relevant opportunities, and provide interview prep.", "status": "in_progress", "skills": ["AI/ML", "EdTech", "B2B SaaS"], "highlights": ["2,400+ active users", "B2B pilot with 3 universities", "$1.2M seed raised"], "metrics": [{"label": "Users", "value": "2,400"}, {"label": "NPS", "value": "72"}]}', 0),
  ('30000001-0001-0001-0001-000000000002', 'text', 'We''re building the career guidance system I wish I had. Our AI understands context—it knows that a first-gen student from Atlanta has different needs than someone with family connections in tech.', '{}', 1),
  ('30000001-0001-0001-0001-000000000002', 'relationship', '', '{"personName": "Marcus Thompson", "personTitle": "Partner", "personOrg": "Techstars Atlanta", "relationship": "Lead Investor", "context": "Led our seed round, provides weekly office hours"}', 2)
ON CONFLICT DO NOTHING;

-- Kwame's Traction blocks
INSERT INTO room_blocks (room_id, block_type, content, metadata, order_index) VALUES
  ('30000001-0001-0001-0001-000000000004', 'metric', '', '{"value": 12400, "label": "MRR", "unit": "USD", "change": 23, "period": "month", "format": "currency"}', 0),
  ('30000001-0001-0001-0001-000000000004', 'metric', '', '{"value": 2400, "label": "Active Users", "change": 18, "period": "month", "format": "number"}', 1),
  ('30000001-0001-0001-0001-000000000004', 'metric', '', '{"value": 72, "label": "NPS Score", "format": "number"}', 2),
  ('30000001-0001-0001-0001-000000000004', 'metric', '', '{"value": 23, "label": "MoM Growth", "unit": "%", "format": "percent"}', 3),
  ('30000001-0001-0001-0001-000000000004', 'milestone', '', '{"title": "Seed Round Closed", "date": "2025-11-15", "description": "Raised $1.2M from Techstars Atlanta and angel investors", "type": "achievement"}', 4),
  ('30000001-0001-0001-0001-000000000004', 'milestone', '', '{"title": "University Pilots Launched", "date": "2025-09-01", "description": "Signed B2B deals with Georgia Tech, Morehouse, and Spelman", "type": "achievement"}', 5)
ON CONFLICT DO NOTHING;

-- Marcus's Identity blocks (showcase - most complete)
INSERT INTO room_blocks (room_id, block_type, content, metadata, order_index) VALUES
  ('30000003-0001-0001-0001-000000000001', 'text', 'I grew up on my grandparents'' farm in East Texas. After MIT, I returned to agriculture with a mission: help small farms compete with industrial operations through smart technology.', '{}', 0),
  ('30000003-0001-0001-0001-000000000001', 'skill', '', '{"name": "Agricultural Systems", "level": "expert", "years": 15, "category": "Domain"}', 1),
  ('30000003-0001-0001-0001-000000000001', 'skill', '', '{"name": "IoT Engineering", "level": "advanced", "years": 5, "category": "Technical"}', 2),
  ('30000003-0001-0001-0001-000000000001', 'skill', '', '{"name": "Supply Chain", "level": "advanced", "years": 8, "category": "Operations"}', 3),
  ('30000003-0001-0001-0001-000000000001', 'education', '', '{"institution": "MIT Sloan School of Management", "degree": "MBA", "field": "Entrepreneurship", "startDate": "2018", "endDate": "2020", "highlights": ["MIT $100K Finalist", "Sustainability Track"]}', 4),
  ('30000003-0001-0001-0001-000000000001', 'education', '', '{"institution": "Texas A&M University", "degree": "B.S.", "field": "Agricultural Engineering", "startDate": "2010", "endDate": "2014"}', 5)
ON CONFLICT DO NOTHING;

-- Marcus's Startup blocks
INSERT INTO room_blocks (room_id, block_type, content, metadata, order_index) VALUES
  ('30000003-0001-0001-0001-000000000002', 'project', '', '{"title": "AgriOS", "description": "Complete farm management platform combining IoT sensors, AI-powered crop recommendations, and direct-to-market sales channels. We help small farms increase yields by 40% while reducing water usage.", "status": "in_progress", "skills": ["IoT", "AI/ML", "AgTech", "Hardware"], "highlights": ["340 farms on platform", "Series A raised", "$2.1M ARR"], "metrics": [{"label": "Farms", "value": "340"}, {"label": "ARR", "value": "$2.1M"}]}', 0),
  ('30000003-0001-0001-0001-000000000002', 'text', 'Our hardware + software solution provides real-time soil monitoring, automated irrigation, and predictive analytics—all accessible via mobile app.', '{}', 1),
  ('30000003-0001-0001-0001-000000000002', 'relationship', '', '{"personName": "Dr. Elena Vasquez", "personTitle": "Partner", "personOrg": "Congruent Ventures", "relationship": "Board Member & Lead Investor", "context": "Led Series A, deep expertise in climate tech"}', 2),
  ('30000003-0001-0001-0001-000000000002', 'relationship', '', '{"personName": "James Chen", "personTitle": "VP Engineering", "personOrg": "John Deere (Former)", "relationship": "Advisor", "context": "Advises on hardware and enterprise sales strategy"}', 3)
ON CONFLICT DO NOTHING;

-- Marcus's Traction blocks
INSERT INTO room_blocks (room_id, block_type, content, metadata, order_index) VALUES
  ('30000003-0001-0001-0001-000000000004', 'metric', '', '{"value": 2100000, "label": "ARR", "unit": "USD", "change": 140, "period": "year", "format": "currency"}', 0),
  ('30000003-0001-0001-0001-000000000004', 'metric', '', '{"value": 340, "label": "Farms on Platform", "change": 25, "period": "quarter", "format": "number"}', 1),
  ('30000003-0001-0001-0001-000000000004', 'metric', '', '{"value": 40, "label": "Avg Yield Improvement", "unit": "%", "format": "percent"}', 2),
  ('30000003-0001-0001-0001-000000000004', 'metric', '', '{"value": 35, "label": "Water Reduction", "unit": "%", "format": "percent"}', 3),
  ('30000003-0001-0001-0001-000000000004', 'metric', '', '{"value": 94, "label": "Customer Retention", "unit": "%", "format": "percent"}', 4),
  ('30000003-0001-0001-0001-000000000004', 'metric', '', '{"value": 8500000, "label": "Series A Raised", "unit": "USD", "format": "currency"}', 5),
  ('30000003-0001-0001-0001-000000000004', 'milestone', '', '{"title": "Series A Closed", "date": "2025-10-01", "description": "$8.5M led by Congruent Ventures", "type": "achievement"}', 6),
  ('30000003-0001-0001-0001-000000000004', 'milestone', '', '{"title": "USDA Innovation Grant", "date": "2025-03-15", "description": "$500K non-dilutive grant", "type": "achievement"}', 7),
  ('30000003-0001-0001-0001-000000000004', 'milestone', '', '{"title": "Forbes 30 Under 30", "date": "2025-12-01", "description": "Agriculture category", "type": "award"}', 8)
ON CONFLICT DO NOTHING;

-- Fatima's Traction blocks
INSERT INTO room_blocks (room_id, block_type, content, metadata, order_index) VALUES
  ('30000004-0001-0001-0001-000000000004', 'metric', '', '{"value": 12000, "label": "Panels Processed", "change": 50, "period": "quarter", "format": "number"}', 0),
  ('30000004-0001-0001-0001-000000000004', 'metric', '', '{"value": 95, "label": "Material Recovery Rate", "unit": "%", "format": "percent"}', 1),
  ('30000004-0001-0001-0001-000000000004', 'metric', '', '{"value": 3, "label": "Installer LOIs", "format": "number"}', 2),
  ('30000004-0001-0001-0001-000000000004', 'metric', '', '{"value": 750000, "label": "DOE Grant", "unit": "USD", "format": "currency"}', 3),
  ('30000004-0001-0001-0001-000000000004', 'milestone', '', '{"title": "Pilot Facility Operational", "date": "2025-08-01", "description": "First commercial-scale recycling facility in Oakland", "type": "release"}', 4),
  ('30000004-0001-0001-0001-000000000004', 'milestone', '', '{"title": "DOE Grant Awarded", "date": "2025-05-15", "description": "$750K for R&D expansion", "type": "achievement"}', 5)
ON CONFLICT DO NOTHING;

-- Devon's Traction blocks
INSERT INTO room_blocks (room_id, block_type, content, metadata, order_index) VALUES
  ('30000006-0001-0001-0001-000000000004', 'metric', '', '{"value": 45, "label": "Business Customers", "change": 20, "period": "month", "format": "number"}', 0),
  ('30000006-0001-0001-0001-000000000004', 'metric', '', '{"value": 8000, "label": "Deliveries per Month", "change": 35, "period": "month", "format": "number"}', 1),
  ('30000006-0001-0001-0001-000000000004', 'metric', '', '{"value": 30, "label": "Avg Cost Reduction", "unit": "%", "format": "percent"}', 2),
  ('30000006-0001-0001-0001-000000000004', 'milestone', '', '{"title": "First Enterprise Customer", "date": "2025-12-01", "description": "Signed regional grocery chain with 12 locations", "type": "achievement"}', 3)
ON CONFLICT DO NOTHING;

-- Tiana's Traction blocks
INSERT INTO room_blocks (room_id, block_type, content, metadata, order_index) VALUES
  ('30000002-0001-0001-0001-000000000004', 'metric', '', '{"value": 850, "label": "Beta Users", "change": 15, "period": "month", "format": "number"}', 0),
  ('30000002-0001-0001-0001-000000000004', 'metric', '', '{"value": 2, "label": "Credit Union Partners", "format": "number"}', 1)
ON CONFLICT DO NOTHING;

-- Jordan's Identity block (minimal)
INSERT INTO room_blocks (room_id, block_type, content, metadata, order_index) VALUES
  ('30000005-0001-0001-0001-000000000001', 'text', 'Working on healthcare access for underserved communities.', '{}', 0)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- Create member profiles with company info
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO member_profiles (member_id, practice, focus, skills)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'PathWAI', 'AI-powered career guidance for first-generation professionals', '{"Primary": ["AI/ML", "Product Strategy", "EdTech"], "Tools": ["TensorFlow", "Python"], "Mediums": []}'),
  ('10000000-0000-0000-0000-000000000002', 'FinBridge', 'Financial literacy for underbanked communities', '{"Primary": ["Finance", "Community Building", "Product"], "Tools": [], "Mediums": []}'),
  ('10000000-0000-0000-0000-000000000003', 'AgriOS', 'Operating system for small-scale sustainable agriculture', '{"Primary": ["AgTech", "IoT", "Operations", "Sustainability"], "Tools": [], "Mediums": []}'),
  ('10000000-0000-0000-0000-000000000004', 'SolarLoop', 'Circular economy solutions for solar panel recycling', '{"Primary": ["CleanTech", "Hardware", "Supply Chain"], "Tools": [], "Mediums": []}'),
  ('10000000-0000-0000-0000-000000000005', 'HealthStack', 'Healthcare access for underserved communities', '{"Primary": ["Healthcare"], "Tools": [], "Mediums": []}'),
  ('10000000-0000-0000-0000-000000000006', 'LogiSync', 'Last-mile logistics optimization for small businesses', '{"Primary": ["Logistics", "Operations", "SaaS"], "Tools": [], "Mediums": []}')
ON CONFLICT (member_id) DO UPDATE SET practice = EXCLUDED.practice, focus = EXCLUDED.focus, skills = EXCLUDED.skills;

-- ═══════════════════════════════════════════════════════════════════════════
-- Create full-text search index for AI search
-- ═══════════════════════════════════════════════════════════════════════════

-- Add tsvector column to members for full-text search
ALTER TABLE members ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_member_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS member_search_vector_trigger ON members;
CREATE TRIGGER member_search_vector_trigger
  BEFORE INSERT OR UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_member_search_vector();

-- Update existing members
UPDATE members SET search_vector =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(title, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'C');

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_members_search ON members USING GIN(search_vector);

-- Add search vector to room_blocks for content search
ALTER TABLE room_blocks ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION update_block_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english', coalesce(NEW.content, '')) ||
    to_tsvector('english', coalesce(NEW.metadata::text, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS block_search_vector_trigger ON room_blocks;
CREATE TRIGGER block_search_vector_trigger
  BEFORE INSERT OR UPDATE ON room_blocks
  FOR EACH ROW EXECUTE FUNCTION update_block_search_vector();

-- Update existing blocks
UPDATE room_blocks SET search_vector =
  to_tsvector('english', coalesce(content, '')) ||
  to_tsvector('english', coalesce(metadata::text, ''));

CREATE INDEX IF NOT EXISTS idx_blocks_search ON room_blocks USING GIN(search_vector);

-- ═══════════════════════════════════════════════════════════════════════════
-- Create search function for AI queries
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION search_community_members(
  p_community_id uuid,
  p_query text,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  member_id uuid,
  name text,
  title text,
  company text,
  location text,
  stage stage_enum,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as member_id,
    m.name,
    m.title,
    mp.practice as company,
    m.location,
    m.stage,
    ts_rank(m.search_vector, plainto_tsquery('english', p_query)) as rank
  FROM members m
  LEFT JOIN member_profiles mp ON mp.member_id = m.id
  WHERE m.community_id = p_community_id
    AND (
      m.search_vector @@ plainto_tsquery('english', p_query)
      OR m.name ILIKE '%' || p_query || '%'
      OR m.title ILIKE '%' || p_query || '%'
      OR mp.practice ILIKE '%' || p_query || '%'
      OR mp.focus ILIKE '%' || p_query || '%'
    )
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_community_members IS 'Full-text search for community members - supports natural language queries';
