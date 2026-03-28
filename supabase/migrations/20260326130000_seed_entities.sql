-- Seed 30 space/defense entities into the entities table
-- Uses upsert to avoid duplicate slug conflicts

INSERT INTO entities (name, slug, type, sectors, description, last_activity, source_counts)
VALUES
  (
    'SpaceX',
    'spacex',
    'company',
    ARRAY['launch', 'LEO broadband', 'defense'],
    'Leading commercial launch provider and Starlink constellation operator',
    NULL,
    '{}'::jsonb
  ),
  (
    'Blue Origin',
    'blue-origin',
    'company',
    ARRAY['launch', 'space tourism', 'defense'],
    'Developing New Glenn orbital rocket and Blue Moon lunar lander',
    NULL,
    '{}'::jsonb
  ),
  (
    'Amazon Leo',
    'amazon-leo',
    'program',
    ARRAY['LEO broadband', 'satellite manufacturing'],
    'Amazon''s 3,236-satellite broadband constellation competing with Starlink',
    NULL,
    '{}'::jsonb
  ),
  (
    'Lockheed Martin',
    'lockheed-martin',
    'company',
    ARRAY['defense', 'satellites', 'missiles', 'space systems'],
    'Prime contractor for Orion spacecraft and major defense programs',
    NULL,
    '{}'::jsonb
  ),
  (
    'Northrop Grumman',
    'northrop-grumman',
    'company',
    ARRAY['defense', 'launch', 'satellites', 'space systems'],
    'Manufacturer of solid rocket motors and mission extension vehicles',
    NULL,
    '{}'::jsonb
  ),
  (
    'Boeing',
    'boeing',
    'company',
    ARRAY['defense', 'launch', 'satellites', 'space systems'],
    'Starliner crew vehicle and SLS core stage manufacturer',
    NULL,
    '{}'::jsonb
  ),
  (
    'L3Harris Technologies',
    'l3harris-technologies',
    'company',
    ARRAY['defense', 'satellites', 'ISR', 'sensors'],
    'Leading provider of ISR satellites and responsive space solutions',
    NULL,
    '{}'::jsonb
  ),
  (
    'RTX (Raytheon)',
    'rtx-raytheon',
    'company',
    ARRAY['defense', 'missiles', 'sensors', 'propulsion'],
    'Major defense contractor specializing in missile systems and satellite sensors',
    NULL,
    '{}'::jsonb
  ),
  (
    'General Dynamics',
    'general-dynamics',
    'company',
    ARRAY['defense', 'IT services', 'submarines'],
    'Defense contractor providing IT infrastructure and combat systems',
    NULL,
    '{}'::jsonb
  ),
  (
    'BAE Systems',
    'bae-systems',
    'company',
    ARRAY['defense', 'electronic warfare', 'satellites'],
    'Global defense company with growing space electronic warfare capabilities',
    NULL,
    '{}'::jsonb
  ),
  (
    'Rocket Lab',
    'rocket-lab',
    'company',
    ARRAY['launch', 'satellites', 'space systems'],
    'Small launch provider expanding to medium-lift with Neutron rocket',
    NULL,
    '{}'::jsonb
  ),
  (
    'Virgin Orbit',
    'virgin-orbit',
    'company',
    ARRAY['launch'],
    'Air-launched small satellite launch provider (ceased operations 2023)',
    NULL,
    '{}'::jsonb
  ),
  (
    'Relativity Space',
    'relativity-space',
    'company',
    ARRAY['launch', '3D printing'],
    'Developing 3D-printed rockets including Terran R medium-lift vehicle',
    NULL,
    '{}'::jsonb
  ),
  (
    'Firefly Aerospace',
    'firefly-aerospace',
    'company',
    ARRAY['launch', 'lunar'],
    'Small launch provider with Alpha rocket and Blue Ghost lunar lander',
    NULL,
    '{}'::jsonb
  ),
  (
    'Astra',
    'astra',
    'company',
    ARRAY['launch', 'spacecraft'],
    'Pivoted from launch to spacecraft and propulsion systems',
    NULL,
    '{}'::jsonb
  ),
  (
    'Planet Labs',
    'planet-labs',
    'company',
    ARRAY['Earth observation', 'remote sensing'],
    'Operates largest constellation of Earth-imaging satellites',
    NULL,
    '{}'::jsonb
  ),
  (
    'BlackSky Technology',
    'blacksky-technology',
    'company',
    ARRAY['Earth observation', 'geospatial intelligence'],
    'Real-time geospatial intelligence and monitoring platform',
    NULL,
    '{}'::jsonb
  ),
  (
    'Maxar Technologies',
    'maxar-technologies',
    'company',
    ARRAY['Earth observation', 'satellites', 'robotics'],
    'High-resolution Earth observation and satellite manufacturing',
    NULL,
    '{}'::jsonb
  ),
  (
    'Viasat',
    'viasat',
    'company',
    ARRAY['satellite broadband', 'defense communications'],
    'Global satellite broadband provider and defense communications',
    NULL,
    '{}'::jsonb
  ),
  (
    'SES',
    'ses',
    'company',
    ARRAY['satellite broadband', 'MEO', 'GEO'],
    'Multi-orbit satellite operator with O3b mPOWER constellation',
    NULL,
    '{}'::jsonb
  ),
  (
    'Intelsat',
    'intelsat',
    'company',
    ARRAY['satellite broadband', 'GEO'],
    'One of the world''s largest satellite operators providing broadband connectivity',
    NULL,
    '{}'::jsonb
  ),
  (
    'Telesat',
    'telesat',
    'company',
    ARRAY['LEO broadband', 'GEO'],
    'Canadian satellite operator developing Lightspeed LEO constellation',
    NULL,
    '{}'::jsonb
  ),
  (
    'OneWeb',
    'oneweb',
    'company',
    ARRAY['LEO broadband'],
    'LEO broadband constellation operator now part of Eutelsat Group',
    NULL,
    '{}'::jsonb
  ),
  (
    'AST SpaceMobile',
    'ast-spacemobile',
    'company',
    ARRAY['direct-to-device', 'LEO broadband'],
    'Building direct-to-smartphone satellite broadband network',
    NULL,
    '{}'::jsonb
  ),
  (
    'Lynk Global',
    'lynk-global',
    'company',
    ARRAY['direct-to-device'],
    'Satellite-based cell tower providing direct-to-phone connectivity',
    NULL,
    '{}'::jsonb
  ),
  (
    'NASA',
    'nasa',
    'agency',
    ARRAY['civil space', 'exploration', 'science', 'aeronautics'],
    'U.S. civil space agency leading Artemis program and space exploration',
    NULL,
    '{}'::jsonb
  ),
  (
    'DARPA',
    'darpa',
    'agency',
    ARRAY['defense R&D', 'space technology'],
    'Defense research agency funding advanced space technology programs',
    NULL,
    '{}'::jsonb
  ),
  (
    'FCC',
    'fcc',
    'agency',
    ARRAY['spectrum regulation', 'satellite licensing'],
    'Regulates satellite communications licensing and spectrum allocation',
    NULL,
    '{}'::jsonb
  ),
  (
    'NRO',
    'nro',
    'agency',
    ARRAY['ISR', 'national security space', 'reconnaissance'],
    'Operates the nation''s reconnaissance satellite systems',
    NULL,
    '{}'::jsonb
  ),
  (
    'Space Force (USSF)',
    'space-force-ussf',
    'agency',
    ARRAY['military space', 'space domain awareness', 'launch'],
    'U.S. military branch responsible for space operations',
    NULL,
    '{}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  type          = EXCLUDED.type,
  sectors       = EXCLUDED.sectors,
  description   = EXCLUDED.description,
  last_activity = EXCLUDED.last_activity,
  source_counts = EXCLUDED.source_counts,
  updated_at    = now();
