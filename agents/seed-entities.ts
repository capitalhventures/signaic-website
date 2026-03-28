/* eslint-disable @typescript-eslint/no-require-imports */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const entities = [
  {
    name: "SpaceX",
    slug: "spacex",
    type: "company",
    sectors: ["launch", "LEO broadband", "defense"],
    description:
      "Leading commercial launch provider and Starlink constellation operator",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Blue Origin",
    slug: "blue-origin",
    type: "company",
    sectors: ["launch", "space tourism", "defense"],
    description:
      "Developing New Glenn orbital rocket and Blue Moon lunar lander",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Amazon Leo",
    slug: "amazon-leo",
    type: "program",
    sectors: ["LEO broadband", "satellite manufacturing"],
    description:
      "Amazon's 3,236-satellite broadband constellation competing with Starlink",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Lockheed Martin",
    slug: "lockheed-martin",
    type: "company",
    sectors: ["defense", "satellites", "missiles", "space systems"],
    description:
      "Prime contractor for Orion spacecraft and major defense programs",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Northrop Grumman",
    slug: "northrop-grumman",
    type: "company",
    sectors: ["defense", "launch", "satellites", "space systems"],
    description:
      "Manufacturer of solid rocket motors and mission extension vehicles",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Boeing",
    slug: "boeing",
    type: "company",
    sectors: ["defense", "launch", "satellites", "space systems"],
    description:
      "Starliner crew vehicle and SLS core stage manufacturer",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "L3Harris Technologies",
    slug: "l3harris-technologies",
    type: "company",
    sectors: ["defense", "satellites", "ISR", "sensors"],
    description:
      "Leading provider of ISR satellites and responsive space solutions",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "RTX (Raytheon)",
    slug: "rtx-raytheon",
    type: "company",
    sectors: ["defense", "missiles", "sensors", "propulsion"],
    description:
      "Major defense contractor specializing in missile systems and satellite sensors",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "General Dynamics",
    slug: "general-dynamics",
    type: "company",
    sectors: ["defense", "IT services", "submarines"],
    description:
      "Defense contractor providing IT infrastructure and combat systems",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "BAE Systems",
    slug: "bae-systems",
    type: "company",
    sectors: ["defense", "electronic warfare", "satellites"],
    description:
      "Global defense company with growing space electronic warfare capabilities",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Rocket Lab",
    slug: "rocket-lab",
    type: "company",
    sectors: ["launch", "satellites", "space systems"],
    description:
      "Small launch provider expanding to medium-lift with Neutron rocket",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Virgin Orbit",
    slug: "virgin-orbit",
    type: "company",
    sectors: ["launch"],
    description:
      "Air-launched small satellite launch provider (ceased operations 2023)",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Relativity Space",
    slug: "relativity-space",
    type: "company",
    sectors: ["launch", "3D printing"],
    description:
      "Developing 3D-printed rockets including Terran R medium-lift vehicle",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Firefly Aerospace",
    slug: "firefly-aerospace",
    type: "company",
    sectors: ["launch", "lunar"],
    description:
      "Small launch provider with Alpha rocket and Blue Ghost lunar lander",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Astra",
    slug: "astra",
    type: "company",
    sectors: ["launch", "spacecraft"],
    description:
      "Pivoted from launch to spacecraft and propulsion systems",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Planet Labs",
    slug: "planet-labs",
    type: "company",
    sectors: ["Earth observation", "remote sensing"],
    description:
      "Operates largest constellation of Earth-imaging satellites",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "BlackSky Technology",
    slug: "blacksky-technology",
    type: "company",
    sectors: ["Earth observation", "geospatial intelligence"],
    description:
      "Real-time geospatial intelligence and monitoring platform",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Maxar Technologies",
    slug: "maxar-technologies",
    type: "company",
    sectors: ["Earth observation", "satellites", "robotics"],
    description:
      "High-resolution Earth observation and satellite manufacturing",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Viasat",
    slug: "viasat",
    type: "company",
    sectors: ["satellite broadband", "defense communications"],
    description:
      "Global satellite broadband provider and defense communications",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "SES",
    slug: "ses",
    type: "company",
    sectors: ["satellite broadband", "MEO", "GEO"],
    description:
      "Multi-orbit satellite operator with O3b mPOWER constellation",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Intelsat",
    slug: "intelsat",
    type: "company",
    sectors: ["satellite broadband", "GEO"],
    description:
      "One of the world's largest satellite operators providing broadband connectivity",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Telesat",
    slug: "telesat",
    type: "company",
    sectors: ["LEO broadband", "GEO"],
    description:
      "Canadian satellite operator developing Lightspeed LEO constellation",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "OneWeb",
    slug: "oneweb",
    type: "company",
    sectors: ["LEO broadband"],
    description:
      "LEO broadband constellation operator now part of Eutelsat Group",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "AST SpaceMobile",
    slug: "ast-spacemobile",
    type: "company",
    sectors: ["direct-to-device", "LEO broadband"],
    description:
      "Building direct-to-smartphone satellite broadband network",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Lynk Global",
    slug: "lynk-global",
    type: "company",
    sectors: ["direct-to-device"],
    description:
      "Satellite-based cell tower providing direct-to-phone connectivity",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "NASA",
    slug: "nasa",
    type: "agency",
    sectors: ["civil space", "exploration", "science", "aeronautics"],
    description:
      "U.S. civil space agency leading Artemis program and space exploration",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "DARPA",
    slug: "darpa",
    type: "agency",
    sectors: ["defense R&D", "space technology"],
    description:
      "Defense research agency funding advanced space technology programs",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "FCC",
    slug: "fcc",
    type: "agency",
    sectors: ["spectrum regulation", "satellite licensing"],
    description:
      "Regulates satellite communications licensing and spectrum allocation",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "NRO",
    slug: "nro",
    type: "agency",
    sectors: ["ISR", "national security space", "reconnaissance"],
    description:
      "Operates the nation's reconnaissance satellite systems",
    last_activity: null,
    source_counts: {},
  },
  {
    name: "Space Force (USSF)",
    slug: "space-force-ussf",
    type: "agency",
    sectors: ["military space", "space domain awareness", "launch"],
    description:
      "U.S. military branch responsible for space operations",
    last_activity: null,
    source_counts: {},
  },
];

async function seed() {
  console.log(`Seeding ${entities.length} entities...`);

  const { data, error } = await supabase
    .from("entities")
    .upsert(entities, { onConflict: "slug" })
    .select();

  if (error) {
    console.error("Error seeding entities:", error.message);
    process.exit(1);
  }

  console.log(`Successfully upserted ${data.length} entities.`);
}

seed();
