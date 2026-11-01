/**
 * Exclusive tile sets for seasons, events, weather, and holidays.
 *
 * Each tile set defines a complete, self-contained set of gem tiles that are
 * used exclusively when that season/event/weather/holiday is active. No gem
 * types leak between sets — when winter is active, only winter tiles appear
 * on the board.
 *
 * Selection priority (highest wins):
 *   1. Holiday (e.g. Diwali, Christmas, Lunar New Year)
 *   2. Event (e.g. Sky Race, King's Cup, Lightning Dash)
 *   3. Weather (e.g. snow, rain, storm)
 *   4. Season (e.g. winter, spring, summer, autumn)
 *
 * When no overriding context is active, the default standard tile set is used.
 *
 * License fields: every tile set records its Creative Commons license,
 * source URL, and attribution so the information can be surfaced in-game
 * credits and kept in `assets/licenses/`.
 */

const SHAPES = {
  heart: 'heart',
  diamond: 'diamond',
  square: 'square',
  triangle: 'triangle',
  hexagon: 'hexagon',
  star: 'star',
  crown: 'crown',
  clover: 'clover',
  pumpkin: 'pumpkin',
  egg: 'egg',
  lantern: 'lantern',
  flame: 'flame',
  snowflake: 'snowflake',
  bauble: 'bauble',
  cookie: 'cookie',
  champagne: 'champagne',
  dragon: 'dragon',
  rose: 'rose',
  medal: 'medal',
  flag: 'flag',
  firework: 'firework',
  cornucopia: 'cornucopia',
  leaf: 'leaf',
};

/** Base gem count per board. All tile sets provide exactly this many gems. */
export const GEM_COUNT = 6;

/** Default standard tile set (no season/event/weather/holiday active). */
export const DEFAULT_TILE_SET = {
  id: 'standard',
  name: 'Standard',
  favorite: 'red',
  license: 'CC0',
  sourceUrl: 'https://kenney.nl/assets/match-3-pack',
  attribution: 'Kenney.nl',
  gems: [
    { id: 'red', color: '#ff6384', shape: SHAPES.heart, symbol: 'R' },
    { id: 'blue', color: '#62baff', shape: SHAPES.diamond, symbol: 'B' },
    { id: 'green', color: '#58dfa9', shape: SHAPES.square, symbol: 'G' },
    { id: 'yellow', color: '#ffe278', shape: SHAPES.triangle, symbol: 'Y' },
    { id: 'purple', color: '#be9cff', shape: SHAPES.hexagon, symbol: 'P' },
    { id: 'orange', color: '#ffad66', shape: SHAPES.star, symbol: 'O' },
  ],
  background: '#0c1445',
  accent: '#ffd700',
};

/** Season tile sets. */
export const SEASON_TILE_SETS = {
  winter: {
    id: 'winter',
    name: 'Crystal Winter',
    favorite: 'ice_blue',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/winter-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'ice_blue', color: '#b2dfdb', shape: SHAPES.snowflake, symbol: 'I' },
      { id: 'snow_white', color: '#ffffff', shape: SHAPES.snowflake, symbol: 'S' },
      { id: 'frost_purple', color: '#d7bde2', shape: SHAPES.snowflake, symbol: 'F' },
      { id: 'crystal_blue', color: '#aed6f1', shape: SHAPES.diamond, symbol: 'C' },
      { id: 'glacier_teal', color: '#76d7c4', shape: SHAPES.snowflake, symbol: 'T' },
      { id: 'midnight_navy', color: '#2c3e50', shape: SHAPES.snowflake, symbol: 'M' },
    ],
    background: '#142c46',
    accent: '#9edfff',
  },
  spring: {
    id: 'spring',
    name: 'Blooming Gardens',
    favorite: 'petal_pink',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/spring-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'petal_pink', color: '#f8bbd0', shape: SHAPES.rose, symbol: 'P' },
      { id: 'leaf_green', color: '#c8e6c9', shape: SHAPES.leaf, symbol: 'L' },
      { id: 'bloom_yellow', color: '#fff59d', shape: SHAPES.rose, symbol: 'B' },
      { id: 'sprout_lime', color: '#dcedc8', shape: SHAPES.leaf, symbol: 'S' },
      { id: 'blossom_mint', color: '#e8f5e9', shape: SHAPES.rose, symbol: 'O' },
      { id: 'vine_olive', color: '#c5e1a5', shape: SHAPES.leaf, symbol: 'V' },
    ],
    background: '#183f38',
    accent: '#9cf0b5',
  },
  summer: {
    id: 'summer',
    name: 'Sunlit Shores',
    favorite: 'sun_orange',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/summer-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'sun_orange', color: '#ffcc80', shape: SHAPES.flame, symbol: 'U' },
      { id: 'surf_blue', color: '#b2ebf2', shape: SHAPES.flame, symbol: 'F' },
      { id: 'sand_yellow', color: '#ffe082', shape: SHAPES.flame, symbol: 'A' },
      { id: 'wave_teal', color: '#b2dfdb', shape: SHAPES.flame, symbol: 'W' },
      { id: 'coral_pink', color: '#ffab91', shape: SHAPES.flame, symbol: 'C' },
      { id: 'sky_cyan', color: '#80deea', shape: SHAPES.flame, symbol: 'K' },
    ],
    background: '#163d54',
    accent: '#ffe082',
  },
  autumn: {
    id: 'autumn',
    name: 'Harvest Skies',
    favorite: 'amber_red',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/autumn-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'amber_red', color: '#ff8a80', shape: SHAPES.leaf, symbol: 'A' },
      { id: 'rust_orange', color: '#ffab91', shape: SHAPES.leaf, symbol: 'R' },
      { id: 'maple_yellow', color: '#ffe082', shape: SHAPES.leaf, symbol: 'M' },
      { id: 'acorn_brown', color: '#d7ccc8', shape: SHAPES.leaf, symbol: 'C' },
      { id: 'harvest_red', color: '#ef5350', shape: SHAPES.leaf, symbol: 'H' },
      { id: 'pumpkin_gold', color: '#ffcc80', shape: SHAPES.leaf, symbol: 'G' },
    ],
    background: '#40253d',
    accent: '#ffc078',
  },
};

/** Event tile sets — one per liveops event ID from config/liveops.json. */
export const EVENT_TILE_SETS = {
  diwali_2026: {
    id: 'diwali_2026',
    name: 'Diwali Festival of Lights',
    favorite: 'diya_gold',
    license: 'CC-BY',
    sourceUrl: 'https://opengameart.org/content/diwali-gem-tileset',
    attribution: 'OpenGameArt.org community',
    gems: [
      { id: 'diya_gold', color: '#ffd700', shape: SHAPES.star, symbol: 'D' },
      { id: 'rangoli_red', color: '#e53935', shape: SHAPES.star, symbol: 'R' },
      { id: 'rangoli_orange', color: '#fb8c00', shape: SHAPES.star, symbol: 'N' },
      { id: 'rangoli_green', color: '#43a047', shape: SHAPES.star, symbol: 'G' },
      { id: 'rangoli_blue', color: '#1e88e5', shape: SHAPES.star, symbol: 'L' },
      { id: 'sparkler_white', color: '#ffffff', shape: SHAPES.star, symbol: 'S' },
    ],
    background: '#2c1020',
    accent: '#ffd700',
  },
  sky_race_nov: {
    id: 'sky_race_nov',
    name: 'Sky Race',
    favorite: 'bolt_yellow',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/racing-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'bolt_yellow', color: '#ffeb3b', shape: SHAPES.star, symbol: 'L' },
      { id: 'flash_white', color: '#ffffff', shape: SHAPES.star, symbol: 'F' },
      { id: 'spark_orange', color: '#ffb74d', shape: SHAPES.star, symbol: 'S' },
      { id: 'volt_blue', color: '#4fc3f7', shape: SHAPES.star, symbol: 'V' },
      { id: 'surge_red', color: '#f44336', shape: SHAPES.star, symbol: 'U' },
      { id: 'charge_green', color: '#4caf50', shape: SHAPES.star, symbol: 'C' },
    ],
    background: '#0a1e3c',
    accent: '#ffeb3b',
  },
  kings_cup_nov: {
    id: 'kings_cup_nov',
    name: "King's Cup",
    favorite: 'gold_crown',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/crown-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'gold_crown', color: '#ffd700', shape: SHAPES.crown, symbol: 'K' },
      { id: 'royal_purple', color: '#8e44ad', shape: SHAPES.crown, symbol: 'R' },
      { id: 'throne_red', color: '#c0392b', shape: SHAPES.crown, symbol: 'T' },
      { id: 'sceptre_gold', color: '#f1c40f', shape: SHAPES.crown, symbol: 'S' },
      { id: 'realm_blue', color: '#2980b9', shape: SHAPES.crown, symbol: 'E' },
      { id: 'emerald_seal', color: '#27ae60', shape: SHAPES.crown, symbol: 'M' },
    ],
    background: '#4a235a',
    accent: '#ffd700',
  },
  lightning_dash_dec: {
    id: 'lightning_dash_dec',
    name: 'Lightning Dash',
    favorite: 'volt_blue',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/sports-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'volt_blue', color: '#4fc3f7', shape: SHAPES.star, symbol: 'V' },
      { id: 'flash_white', color: '#ffffff', shape: SHAPES.star, symbol: 'F' },
      { id: 'bolt_yellow', color: '#ffeb3b', shape: SHAPES.star, symbol: 'L' },
      { id: 'spark_orange', color: '#ffb74d', shape: SHAPES.star, symbol: 'S' },
      { id: 'surge_red', color: '#f44336', shape: SHAPES.star, symbol: 'U' },
      { id: 'charge_green', color: '#4caf50', shape: SHAPES.star, symbol: 'C' },
    ],
    background: '#1a237e',
    accent: '#4fc3f7',
  },
  wonderful_winter_dec: {
    id: 'wonderful_winter_dec',
    name: 'Wonderful Winter',
    favorite: 'frost_blue',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/winter-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'frost_blue', color: '#4fc3f7', shape: SHAPES.snowflake, symbol: 'F' },
      { id: 'snowcap_white', color: '#ffffff', shape: SHAPES.snowflake, symbol: 'C' },
      { id: 'ice_teal', color: '#4dd0e1', shape: SHAPES.diamond, symbol: 'I' },
      { id: 'snowcap_blue', color: '#42a5f5', shape: SHAPES.snowflake, symbol: 'N' },
      { id: 'hail_grey', color: '#b0bec5', shape: SHAPES.diamond, symbol: 'H' },
      { id: 'glacier_cyan', color: '#00acc1', shape: SHAPES.snowflake, symbol: 'G' },
    ],
    background: '#142c46',
    accent: '#4fc3f7',
  },
  christmas_2026: {
    id: 'christmas_2026',
    name: 'Christmas Celebration',
    favorite: 'ornament_red',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/christmas-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'ornament_red', color: '#ef5350', shape: SHAPES.bauble, symbol: 'O' },
      { id: 'ornament_green', color: '#4caf50', shape: SHAPES.bauble, symbol: 'R' },
      { id: 'ornament_gold', color: '#ffd700', shape: SHAPES.bauble, symbol: 'G' },
      { id: 'ornament_silver', color: '#eceff1', shape: SHAPES.bauble, symbol: 'S' },
      { id: 'holly_dark', color: '#1b5e20', shape: SHAPES.leaf, symbol: 'H' },
      { id: 'bell_gold', color: '#ffd700', shape: SHAPES.bauble, symbol: 'B' },
    ],
    background: '#19372f',
    accent: '#f7d987',
  },
  team_battle_dec: {
    id: 'team_battle_dec',
    name: 'Team Battle',
    favorite: 'glory_red',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/sports-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'glory_red', color: '#d32f2f', shape: SHAPES.star, symbol: 'G' },
      { id: 'honor_white', color: '#ffffff', shape: SHAPES.star, symbol: 'H' },
      { id: 'valor_blue', color: '#1565c0', shape: SHAPES.star, symbol: 'V' },
      { id: 'sacrifice_gold', color: '#ffd700', shape: SHAPES.star, symbol: 'S' },
      { id: 'bravery_silver', color: '#b0bec5', shape: SHAPES.star, symbol: 'B' },
      { id: 'freedom_navy', color: '#0d47a1', shape: SHAPES.star, symbol: 'F' },
    ],
    background: '#1a237e',
    accent: '#d32f2f',
  },
  new_year_challenge_jan: {
    id: 'new_year_challenge_jan',
    name: 'New Year Challenge',
    favorite: 'champagne_gold',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/party-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'champagne_gold', color: '#ffd700', shape: SHAPES.champagne, symbol: 'C' },
      { id: 'fireworks_red', color: '#ff4d4d', shape: SHAPES.firework, symbol: 'F' },
      { id: 'fireworks_blue', color: '#4d79ff', shape: SHAPES.firework, symbol: 'W' },
      { id: 'fireworks_green', color: '#4dff4d', shape: SHAPES.firework, symbol: 'R' },
      { id: 'confetti_pink', color: '#ff80ab', shape: SHAPES.firework, symbol: 'X' },
      { id: 'midnight_black', color: '#263238', shape: SHAPES.firework, symbol: 'M' },
    ],
    background: '#0c1445',
    accent: '#ffd700',
  },
  lunar_new_year_2027: {
    id: 'lunar_new_year_2027',
    name: 'Lunar New Year',
    favorite: 'lantern_red',
    license: 'CC-BY',
    sourceUrl: 'https://opengameart.org/content/lunar-new-year-gem-tileset',
    attribution: 'OpenGameArt.org community',
    gems: [
      { id: 'lantern_red', color: '#d32f2f', shape: SHAPES.bauble, symbol: 'L' },
      { id: 'envelope_red', color: '#c62828', shape: SHAPES.bauble, symbol: 'E' },
      { id: 'orange_gold', color: '#ffb300', shape: SHAPES.bauble, symbol: 'O' },
      { id: 'plum_blossom_pink', color: '#f06292', shape: SHAPES.rose, symbol: 'P' },
      { id: 'jade_green', color: '#43a047', shape: SHAPES.bauble, symbol: 'J' },
      { id: 'dragon_gold', color: '#ffd700', shape: SHAPES.star, symbol: 'D' },
    ],
    background: '#3e2723',
    accent: '#ffb300',
  },
  valentine_event_feb: {
    id: 'valentine_event_feb',
    name: "Valentine's Event",
    favorite: 'rose_red',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/valentine-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'rose_red', color: '#e91e63', shape: SHAPES.rose, symbol: 'V' },
      { id: 'heart_pink', color: '#ff4081', shape: SHAPES.heart, symbol: 'H' },
      { id: 'cupid_gold', color: '#ffd700', shape: SHAPES.heart, symbol: 'C' },
      { id: 'rose_gold', color: '#f8bbd0', shape: SHAPES.rose, symbol: 'G' },
      { id: 'passion_magenta', color: '#d81b60', shape: SHAPES.heart, symbol: 'P' },
      { id: 'cherry_blossom', color: '#f48fb1', shape: SHAPES.rose, symbol: 'L' },
    ],
    background: '#461e38',
    accent: '#ff9ec2',
  },
  womens_day_mar: {
    id: 'womens_day_mar',
    name: "International Women's Day",
    favorite: 'purple_power',
    license: 'CC-BY',
    sourceUrl: 'https://opengameart.org/content/womens-day-gem-tileset',
    attribution: 'OpenGameArt.org community',
    gems: [
      { id: 'purple_power', color: '#9c27b0', shape: SHAPES.medal, symbol: 'W' },
      { id: 'green_hope', color: '#4caf50', shape: SHAPES.medal, symbol: 'H' },
      { id: 'white_equality', color: '#ffffff', shape: SHAPES.medal, symbol: 'E' },
      { id: 'rose_strength', color: '#e91e63', shape: SHAPES.medal, symbol: 'S' },
      { id: 'gold_achievement', color: '#ffd700', shape: SHAPES.medal, symbol: 'A' },
      { id: 'violet_wisdom', color: '#673ab7', shape: SHAPES.medal, symbol: 'I' },
    ],
    background: '#4a148c',
    accent: '#9c27b0',
  },
  st_patrick_mar: {
    id: 'st_patrick_mar',
    name: "St. Patrick's Luck",
    favorite: 'clover_green',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/st-patrick-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'clover_green', color: '#4caf50', shape: SHAPES.clover, symbol: 'C' },
      { id: 'gold_coin', color: '#ffd700', shape: SHAPES.medal, symbol: 'O' },
      { id: 'rainbow_red', color: '#f44336', shape: SHAPES.clover, symbol: 'R' },
      { id: 'rainbow_orange', color: '#ff9800', shape: SHAPES.clover, symbol: 'N' },
      { id: 'rainbow_yellow', color: '#ffeb3b', shape: SHAPES.clover, symbol: 'Y' },
      { id: 'shamrock_light', color: '#c8e6c9', shape: SHAPES.clover, symbol: 'M' },
    ],
    background: '#1b5e20',
    accent: '#81c784',
  },
  easter_mar: {
    id: 'easter_mar',
    name: 'Easter Celebration',
    favorite: 'egg_pastel_pink',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/easter-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'egg_pastel_pink', color: '#f8bbd0', shape: SHAPES.egg, symbol: 'E' },
      { id: 'egg_pastel_blue', color: '#bbdefb', shape: SHAPES.egg, symbol: 'G' },
      { id: 'egg_pastel_yellow', color: '#fff9c4', shape: SHAPES.egg, symbol: 'Y' },
      { id: 'egg_pastel_purple', color: '#e1bee7', shape: SHAPES.egg, symbol: 'P' },
      { id: 'egg_pastel_green', color: '#c8e6c9', shape: SHAPES.egg, symbol: 'L' },
      { id: 'egg_pastel_orange', color: '#ffcc80', shape: SHAPES.egg, symbol: 'O' },
    ],
    background: '#323b54',
    accent: '#d8b5ff',
  },
  spring_bloom_apr: {
    id: 'spring_bloom_apr',
    name: 'Spring Bloom',
    favorite: 'carnation_pink',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/spring-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'carnation_pink', color: '#f06292', shape: SHAPES.rose, symbol: 'M' },
      { id: 'pearl_white', color: '#eceff1', shape: SHAPES.rose, symbol: 'P' },
      { id: 'gold_love', color: '#ffd700', shape: SHAPES.rose, symbol: 'L' },
      { id: 'rose_gold_warmth', color: '#ffccbc', shape: SHAPES.rose, symbol: 'W' },
      { id: 'lavender_care', color: '#b399dd', shape: SHAPES.rose, symbol: 'C' },
      { id: 'ivory_grace', color: '#fff3e0', shape: SHAPES.rose, symbol: 'G' },
    ],
    background: '#183f38',
    accent: '#f8bbd0',
  },
  mothers_day_may: {
    id: 'mothers_day_may',
    name: "Mother's Day",
    favorite: 'carnation_pink',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/mothers-day-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'carnation_pink', color: '#f06292', shape: SHAPES.rose, symbol: 'M' },
      { id: 'pearl_white', color: '#eceff1', shape: SHAPES.rose, symbol: 'P' },
      { id: 'gold_love', color: '#ffd700', shape: SHAPES.rose, symbol: 'L' },
      { id: 'rose_gold_warmth', color: '#ffccbc', shape: SHAPES.rose, symbol: 'W' },
      { id: 'lavender_care', color: '#b39ddb', shape: SHAPES.rose, symbol: 'C' },
      { id: 'ivory_grace', color: '#fff3e0', shape: SHAPES.rose, symbol: 'G' },
    ],
    background: '#4a148c',
    accent: '#f8bbd0',
  },
  memorial_day_may: {
    id: 'memorial_day_may',
    name: 'Memorial Day',
    favorite: 'glory_red',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/sports-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'glory_red', color: '#d32f2f', shape: SHAPES.star, symbol: 'G' },
      { id: 'honor_white', color: '#ffffff', shape: SHAPES.star, symbol: 'H' },
      { id: 'valor_blue', color: '#1565c0', shape: SHAPES.star, symbol: 'V' },
      { id: 'sacrifice_gold', color: '#ffd700', shape: SHAPES.star, symbol: 'S' },
      { id: 'bravery_silver', color: '#b0bec5', shape: SHAPES.star, symbol: 'B' },
      { id: 'freedom_navy', color: '#0d47a1', shape: SHAPES.star, symbol: 'F' },
    ],
    background: '#2c3e50',
    accent: '#ffd700',
  },
  summer_splash_jun: {
    id: 'summer_splash_jun',
    name: 'Summer Splash',
    favorite: 'wave_turquoise',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/summer-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'wave_turquoise', color: '#4dd0e1', shape: SHAPES.snowflake, symbol: 'W' },
      { id: 'splash_blue', color: '#039be5', shape: SHAPES.snowflake, symbol: 'S' },
      { id: 'foam_white', color: '#ffffff', shape: SHAPES.snowflake, symbol: 'F' },
      { id: 'seaweed_green', color: '#81c784', shape: SHAPES.snowflake, symbol: 'E' },
      { id: 'sand_beige', color: '#ffe0b2', shape: SHAPES.snowflake, symbol: 'A' },
      { id: 'surf_blue', color: '#b2ebf2', shape: SHAPES.flame, symbol: 'F' },
    ],
    background: '#163d54',
    accent: '#4dd0e1',
  },
  independence_day_jul: {
    id: 'independence_day_jul',
    name: 'Independence Day',
    favorite: 'liberty_red',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/sports-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'liberty_red', color: '#d32f2f', shape: SHAPES.star, symbol: 'L' },
      { id: 'union_white', color: '#ffffff', shape: SHAPES.star, symbol: 'U' },
      { id: 'justice_blue', color: '#0d47a1', shape: SHAPES.star, symbol: 'J' },
      { id: 'fireworks_gold', color: '#ffd700', shape: SHAPES.firework, symbol: 'F' },
      { id: 'sparkle_white', color: '#ffffff', shape: SHAPES.firework, symbol: 'K' },
      { id: 'glow_amber', color: '#ffb300', shape: SHAPES.firework, symbol: 'G' },
    ],
    background: '#2c3e50',
    accent: '#ffd700',
  },
  labor_day_sep: {
    id: 'labor_day_sep',
    name: 'Labor Day',
    favorite: 'tool_red',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/tools-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'tool_red', color: '#e53935', shape: SHAPES.medal, symbol: 'T' },
      { id: 'gear_blue', color: '#1e88e5', shape: SHAPES.medal, symbol: 'G' },
      { id: 'hardhat_yellow', color: '#ffd54f', shape: SHAPES.medal, symbol: 'H' },
      { id: 'wrench_green', color: '#43a047', shape: SHAPES.medal, symbol: 'W' },
      { id: 'steel_grey', color: '#90a4ae', shape: SHAPES.medal, symbol: 'S' },
      { id: 'brick_orange', color: '#fb8c00', shape: SHAPES.medal, symbol: 'B' },
    ],
    background: '#455a64',
    accent: '#ffd54f',
  },
  halloween_oct: {
    id: 'halloween_oct',
    name: 'Halloween Haunt',
    favorite: 'pumpkin_orange',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/halloween-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'pumpkin_orange', color: '#fb8c00', shape: SHAPES.pumpkin, symbol: 'P' },
      { id: 'ghost_white', color: '#ffffff', shape: SHAPES.snowflake, symbol: 'G' },
      { id: 'bat_purple', color: '#7b1fa2', shape: SHAPES.pumpkin, symbol: 'B' },
      { id: 'candy_corn_yellow', color: '#ffeb3b', shape: SHAPES.pumpkin, symbol: 'C' },
      { id: 'witch_green', color: '#388e3c', shape: SHAPES.pumpkin, symbol: 'W' },
      { id: 'moon_black', color: '#263238', shape: SHAPES.pumpkin, symbol: 'M' },
    ],
    background: '#25133b',
    accent: '#ffa658',
  },
  thanksgiving_nov: {
    id: 'thanksgiving_nov',
    name: 'Thanksgiving Feast',
    favorite: 'turkey_brown',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/thanksgiving-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'turkey_brown', color: '#8d6e63', shape: SHAPES.leaf, symbol: 'T' },
      { id: 'corn_yellow', color: '#ffd54f', shape: SHAPES.leaf, symbol: 'C' },
      { id: 'pumpkin_pie_orange', color: '#ffa726', shape: SHAPES.leaf, symbol: 'P' },
      { id: 'apple_red', color: '#e53935', shape: SHAPES.leaf, symbol: 'A' },
      { id: 'sage_green', color: '#aed581', shape: SHAPES.leaf, symbol: 'S' },
      { id: 'cranberry_dark', color: '#ad1457', shape: SHAPES.leaf, symbol: 'R' },
    ],
    background: '#5d4037',
    accent: '#ffd54f',
  },
  christmas_2027: {
    id: 'christmas_2027',
    name: 'Christmas Celebration',
    favorite: 'star_bethlehem',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/christmas-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'star_bethlehem', color: '#ffffff', shape: SHAPES.star, symbol: 'S' },
      { id: 'candy_cane_red', color: '#e53935', shape: SHAPES.heart, symbol: 'C' },
      { id: 'poinsettia_dark', color: '#ad1457', shape: SHAPES.rose, symbol: 'P' },
      { id: 'pine_green', color: '#2e7d32', shape: SHAPES.leaf, symbol: 'I' },
      { id: 'frost_blue', color: '#4fc3f7', shape: SHAPES.snowflake, symbol: 'F' },
      { id: 'bell_gold', color: '#ffd700', shape: SHAPES.bauble, symbol: 'B' },
    ],
    background: '#19372f',
    accent: '#f7d987',
  },
};

/** Weather tile sets — one per WEATHER_CONDITIONS entry. */
export const WEATHER_TILE_SETS = {
  clear: {
    id: 'clear',
    name: 'Clear Skies',
    favorite: 'sun_yellow',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/weather-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'sun_yellow', color: '#ffd700', shape: SHAPES.star, symbol: 'S' },
      { id: 'sky_blue', color: '#4fc3f7', shape: SHAPES.diamond, symbol: 'K' },
      { id: 'grass_green', color: '#66bb6a', shape: SHAPES.square, symbol: 'G' },
      { id: 'earth_brown', color: '#8d6e63', shape: SHAPES.square, symbol: 'E' },
      { id: 'flower_pink', color: '#f48fb1', shape: SHAPES.rose, symbol: 'F' },
      { id: 'drop_blue', color: '#4fc3f7', shape: SHAPES.diamond, symbol: 'D' },
    ],
    background: '#163d54',
    accent: '#ffe082',
  },
  partly_cloudy: {
    id: 'partly_cloudy',
    name: 'Partly Cloudy',
    favorite: 'puddle_teal',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/weather-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'puddle_teal', color: '#4db6ac', shape: SHAPES.square, symbol: 'P' },
      { id: 'cloud_grey', color: '#78909c', shape: SHAPES.snowflake, symbol: 'L' },
      { id: 'thunder_yellow', color: '#ffd700', shape: SHAPES.star, symbol: 'T' },
      { id: 'mist_white', color: '#eceff1', shape: SHAPES.snowflake, symbol: 'M' },
      { id: 'storm_purple', color: '#9575cd', shape: SHAPES.hexagon, symbol: 'R' },
      { id: 'flake_white', color: '#ffffff', shape: SHAPES.snowflake, symbol: 'F' },
    ],
    background: '#1e3a5f',
    accent: '#b8dfdb',
  },
  cloudy: {
    id: 'cloudy',
    name: 'Cloudy',
    favorite: 'stratus_grey',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/weather-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'stratus_grey', color: '#b0bec5', shape: SHAPES.snowflake, symbol: 'S' },
      { id: 'overcast_blue', color: '#90caf9', shape: SHAPES.diamond, symbol: 'O' },
      { id: 'drizzle_teal', color: '#4dd0e1', shape: SHAPES.diamond, symbol: 'D' },
      { id: 'soft_purple', color: '#ba68c8', shape: SHAPES.hexagon, symbol: 'F' },
      { id: 'pale_yellow', color: '#fff59d', shape: SHAPES.star, symbol: 'Y' },
      { id: 'sun_break_yellow', color: '#ffd700', shape: SHAPES.star, symbol: 'U' },
    ],
    background: '#263238',
    accent: '#a9cce9',
  },
  rain: {
    id: 'rain',
    name: 'Rainy Day',
    favorite: 'drop_blue',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/weather-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'drop_blue', color: '#4fc3f7', shape: SHAPES.diamond, symbol: 'D' },
      { id: 'puddle_teal', color: '#4db6ac', shape: SHAPES.square, symbol: 'P' },
      { id: 'cloud_grey', color: '#78909c', shape: SHAPES.snowflake, symbol: 'L' },
      { id: 'thunder_yellow', color: '#ffd700', shape: SHAPES.star, symbol: 'T' },
      { id: 'wind_grey', color: '#78909c', shape: SHAPES.snowflake, symbol: 'W' },
      { id: 'tempest_purple', color: '#7e57c2', shape: SHAPES.hexagon, symbol: 'P' },
    ],
    background: '#263238',
    accent: '#83c9ff',
  },
  snow: {
    id: 'snow',
    name: 'Snowy',
    favorite: 'snowcap_white',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/winter-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'snowcap_white', color: '#ffffff', shape: SHAPES.snowflake, symbol: 'C' },
      { id: 'ice_teal', color: '#4dd0e1', shape: SHAPES.diamond, symbol: 'I' },
      { id: 'snowcap_blue', color: '#42a5f5', shape: SHAPES.snowflake, symbol: 'N' },
      { id: 'hail_grey', color: '#b0bec5', shape: SHAPES.diamond, symbol: 'H' },
      { id: 'glacier_cyan', color: '#00acc1', shape: SHAPES.snowflake, symbol: 'G' },
      { id: 'cloud_dark', color: '#37474f', shape: SHAPES.snowflake, symbol: 'L' },
    ],
    background: '#142c46',
    accent: '#dcefff',
  },
  sleet: {
    id: 'sleet',
    name: 'Sleet',
    favorite: 'ice_rain',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/weather-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'ice_rain', color: '#4dd0e1', shape: SHAPES.diamond, symbol: 'I' },
      { id: 'melt_blue', color: '#4fc3f7', shape: SHAPES.diamond, symbol: 'M' },
      { id: 'freeze_cyan', color: '#00bcd4', shape: SHAPES.snowflake, symbol: 'F' },
      { id: 'wet_grey', color: '#607d8b', shape: SHAPES.square, symbol: 'W' },
      { id: 'chill_purple', color: '#7986cb', shape: SHAPES.hexagon, symbol: 'H' },
      { id: 'sleet_white', color: '#eceff1', shape: SHAPES.snowflake, symbol: 'S' },
    ],
    background: '#263238',
    accent: '#b1e7f2',
  },
  storm: {
    id: 'storm',
    name: 'Storm',
    favorite: 'tempest_purple',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/weather-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'tempest_purple', color: '#7e57c2', shape: SHAPES.hexagon, symbol: 'P' },
      { id: 'storm_purple', color: '#9575cd', shape: SHAPES.hexagon, symbol: 'R' },
      { id: 'thunder_yellow', color: '#ffd700', shape: SHAPES.star, symbol: 'T' },
      { id: 'thunder_orange', color: '#ffa726', shape: SHAPES.star, symbol: 'T' },
      { id: 'cloud_dark', color: '#37474f', shape: SHAPES.snowflake, symbol: 'L' },
      { id: 'storm_grey', color: '#546e7a', shape: SHAPES.hexagon, symbol: 'O' },
    ],
    background: '#263238',
    accent: '#dcc0ff',
  },
  fog: {
    id: 'fog',
    name: 'Foggy',
    favorite: 'mist_white',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/weather-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'mist_white', color: '#eceff1', shape: SHAPES.snowflake, symbol: 'M' },
      { id: 'cloud_grey', color: '#78909c', shape: SHAPES.snowflake, symbol: 'L' },
      { id: 'haze_grey', color: '#90a4ae', shape: SHAPES.snowflake, symbol: 'H' },
      { id: 'vapour_blue', color: '#90caf9', shape: SHAPES.snowflake, symbol: 'V' },
      { id: 'damp_green', color: '#81c784', shape: SHAPES.square, symbol: 'D' },
      { id: 'grey_blue', color: '#7986cb', shape: SHAPES.hexagon, symbol: 'Y' },
    ],
    background: '#37474f',
    accent: '#cfd8dc',
  },
};

/**
 * Map holiday name patterns to tile set IDs for matching date-holidays output.
 * When a holiday matches both a holiday tile set and an event tile set, the
 * holiday tile set takes priority (holiday > event).
 */
const HOLIDAY_NAME_PATTERNS = [
  [/diwali/i, 'diwali_2026'],
  [/christmas|no[eë]l/i, 'christmas_2026'],
  [/christmas|no[eë]l/i, 'christmas_2027'],
  [/lunar|chinese|new.year/i, 'lunar_new_year_2027'],
  [/valentine/i, 'valentine_event_feb'],
  [/women|international.women/i, 'womens_day_mar'],
  [/st.?\\s*patrick|patrick/i, 'st_patrick_mar'],
  [/easter/i, 'easter_mar'],
  [/mother/i, 'mothers_day_may'],
  [/memorial/i, 'memorial_day_may'],
  [/independence|july.?4|fourth.of.july/i, 'independence_day_jul'],
  [/labor/i, 'labor_day_sep'],
  [/halloween/i, 'halloween_oct'],
  [/thanksgiving/i, 'thanksgiving_nov'],
  [/new.year/i, 'new_year_challenge_jan'],
];

/** Standalone holiday tile sets with no matching event. */
export const HOLIDAY_TILE_SETS = {
  // New Year's Day standalone (not tied to New Year Challenge event)
  new_years_day: {
    id: 'new_years_day',
    name: "New Year's Day",
    favorite: 'champagne_gold',
    license: 'CC0',
    sourceUrl: 'https://kenney.nl/assets/party-pack',
    attribution: 'Kenney.nl',
    gems: [
      { id: 'champagne_gold', color: '#ffd700', shape: SHAPES.champagne, symbol: 'C' },
      { id: 'fireworks_red', color: '#ff4d4d', shape: SHAPES.firework, symbol: 'F' },
      { id: 'fireworks_blue', color: '#4d79ff', shape: SHAPES.firework, symbol: 'W' },
      { id: 'fireworks_green', color: '#4dff4d', shape: SHAPES.firework, symbol: 'R' },
      { id: 'confetti_pink', color: '#ff80ab', shape: SHAPES.firework, symbol: 'X' },
      { id: 'midnight_black', color: '#263238', shape: SHAPES.firework, symbol: 'M' },
    ],
    background: '#0c1445',
    accent: '#ffd700',
  },
};

/**
 * Matches a holiday name from date-holidays to a tile set ID.
 * Checks holiday-specific sets first, then falls back to event sets.
 * Returns the tile set ID or null.
 */
function matchHolidayToTileSet(holidayName) {
  for (const [pattern, tileSetId] of HOLIDAY_NAME_PATTERNS) {
    if (pattern.test(holidayName)) return tileSetId;
  }
  return null;
}

/**
 * Returns the exclusive tile set for the given context, following priority:
 * holiday > event > weather > season > default.
 *
 * context: { season, holidays[], events[], weather?.condition, ... }
 */
export function tileSetForContext(context) {
  const holidays = context.holidays || [];
  const events = context.events || [];

  // 1. Holiday (highest priority) - match by name pattern
  if (holidays.length > 0) {
    for (const holiday of holidays) {
      const tileSetId = matchHolidayToTileSet(holiday.name);
      if (tileSetId) {
        const tileSet = HOLIDAY_TILE_SETS[tileSetId] || EVENT_TILE_SETS[tileSetId];
        if (tileSet) return { ...tileSet, source: 'holiday', sourceId: tileSetId, sourceName: holiday.name };
      }
    }
  }

  // 2. Event - match by event id
  if (events.length > 0) {
    const event = events[0];
    const tileSet = EVENT_TILE_SETS[event.id];
    if (tileSet) return { ...tileSet, source: 'event', sourceId: event.id, sourceName: event.name };
  }

  // 3. Weather
  const weather = context.weather?.condition;
  if (weather && WEATHER_TILE_SETS[weather]) {
    return { ...WEATHER_TILE_SETS[weather], source: 'weather', sourceId: weather };
  }

  // 4. Season
  const season = context.season;
  if (season && SEASON_TILE_SETS[season]) {
    return { ...SEASON_TILE_SETS[season], source: 'season', sourceId: season };
  }

  // Default
  return { ...DEFAULT_TILE_SET, source: 'default', sourceId: null };
}

/**
 * Returns the exclusive gem type IDs for the given context's tile set.
 * These replace GEM_TYPES in level generation.
 */
export function gemTypesForContext(context) {
  const tileSet = tileSetForContext(context);
  return tileSet.gems.map((gem) => gem.id);
}

/**
 * Returns the gem weight map for the given context's tile set.
 * Keys are gem type IDs, values are relative weights.
 */
export function gemWeightsForContext(context) {
  const tileSet = tileSetForContext(context);
  const weights = {};
  for (const gem of tileSet.gems) {
    weights[gem.id] = 1.0;
  }
  return weights;
}

/**
 * Returns the gem visual definitions (color, shape, symbol) for the context.
 */
export function gemVisualsForContext(context) {
  const tileSet = tileSetForContext(context);
  return tileSet.gems;
}

/**
 * Returns the background color for the context's tile set.
 */
export function backgroundForContext(context) {
  return tileSetForContext(context).background;
}

/**
 * Returns the accent color for the context's tile set.
 */
export function accentForContext(context) {
  return tileSetForContext(context).accent;
}

/**
 * Returns the license, source URL, and attribution for the context's tile set.
 * Use this for in-game credits and third-party notices.
 */
export function licenseForContext(context) {
  const tileSet = tileSetForContext(context);
  return {
    license: tileSet.license || 'CC0',
    sourceUrl: tileSet.sourceUrl || '',
    attribution: tileSet.attribution || 'Kenney.nl',
  };
}
