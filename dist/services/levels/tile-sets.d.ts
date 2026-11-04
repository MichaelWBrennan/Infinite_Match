/**
 * Returns the exclusive tile set for the given context, following priority:
 * holiday > event > weather > season > default.
 *
 * context: { season, holidays[], events[], weather?.condition, ... }
 */
export function tileSetForContext(context: any): any;
/**
 * Returns the exclusive gem type IDs for the given context's tile set.
 * These replace GEM_TYPES in level generation.
 */
export function gemTypesForContext(context: any): any;
/**
 * Returns the gem weight map for the given context's tile set.
 * Keys are gem type IDs, values are relative weights.
 */
export function gemWeightsForContext(context: any): {};
/**
 * Returns the gem visual definitions (color, shape, symbol) for the context.
 */
export function gemVisualsForContext(context: any): any;
/**
 * Returns the background color for the context's tile set.
 */
export function backgroundForContext(context: any): any;
/**
 * Returns the accent color for the context's tile set.
 */
export function accentForContext(context: any): any;
/**
 * Returns the license, source URL, and attribution for the context's tile set.
 * Use this for in-game credits and third-party notices.
 */
export function licenseForContext(context: any): {
    license: any;
    sourceUrl: any;
    attribution: any;
};
/** Base gem count per board. All tile sets provide exactly this many gems. */
export const GEM_COUNT: 6;
export namespace DEFAULT_TILE_SET {
    let id: string;
    let name: string;
    let favorite: string;
    let license: string;
    let sourceUrl: string;
    let attribution: string;
    let gems: {
        id: string;
        color: string;
        shape: string;
        symbol: string;
    }[];
    let background: string;
    let accent: string;
}
export namespace SEASON_TILE_SETS {
    namespace winter {
        let id_1: string;
        export { id_1 as id };
        let name_1: string;
        export { name_1 as name };
        let favorite_1: string;
        export { favorite_1 as favorite };
        let license_1: string;
        export { license_1 as license };
        let sourceUrl_1: string;
        export { sourceUrl_1 as sourceUrl };
        let attribution_1: string;
        export { attribution_1 as attribution };
        let gems_1: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_1 as gems };
        let background_1: string;
        export { background_1 as background };
        let accent_1: string;
        export { accent_1 as accent };
    }
    namespace spring {
        let id_2: string;
        export { id_2 as id };
        let name_2: string;
        export { name_2 as name };
        let favorite_2: string;
        export { favorite_2 as favorite };
        let license_2: string;
        export { license_2 as license };
        let sourceUrl_2: string;
        export { sourceUrl_2 as sourceUrl };
        let attribution_2: string;
        export { attribution_2 as attribution };
        let gems_2: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_2 as gems };
        let background_2: string;
        export { background_2 as background };
        let accent_2: string;
        export { accent_2 as accent };
    }
    namespace summer {
        let id_3: string;
        export { id_3 as id };
        let name_3: string;
        export { name_3 as name };
        let favorite_3: string;
        export { favorite_3 as favorite };
        let license_3: string;
        export { license_3 as license };
        let sourceUrl_3: string;
        export { sourceUrl_3 as sourceUrl };
        let attribution_3: string;
        export { attribution_3 as attribution };
        let gems_3: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_3 as gems };
        let background_3: string;
        export { background_3 as background };
        let accent_3: string;
        export { accent_3 as accent };
    }
    namespace autumn {
        let id_4: string;
        export { id_4 as id };
        let name_4: string;
        export { name_4 as name };
        let favorite_4: string;
        export { favorite_4 as favorite };
        let license_4: string;
        export { license_4 as license };
        let sourceUrl_4: string;
        export { sourceUrl_4 as sourceUrl };
        let attribution_4: string;
        export { attribution_4 as attribution };
        let gems_4: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_4 as gems };
        let background_4: string;
        export { background_4 as background };
        let accent_4: string;
        export { accent_4 as accent };
    }
}
export namespace EVENT_TILE_SETS {
    namespace diwali_2026 {
        let id_5: string;
        export { id_5 as id };
        let name_5: string;
        export { name_5 as name };
        let favorite_5: string;
        export { favorite_5 as favorite };
        let license_5: string;
        export { license_5 as license };
        let sourceUrl_5: string;
        export { sourceUrl_5 as sourceUrl };
        let attribution_5: string;
        export { attribution_5 as attribution };
        let gems_5: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_5 as gems };
        let background_5: string;
        export { background_5 as background };
        let accent_5: string;
        export { accent_5 as accent };
    }
    namespace sky_race_nov {
        let id_6: string;
        export { id_6 as id };
        let name_6: string;
        export { name_6 as name };
        let favorite_6: string;
        export { favorite_6 as favorite };
        let license_6: string;
        export { license_6 as license };
        let sourceUrl_6: string;
        export { sourceUrl_6 as sourceUrl };
        let attribution_6: string;
        export { attribution_6 as attribution };
        let gems_6: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_6 as gems };
        let background_6: string;
        export { background_6 as background };
        let accent_6: string;
        export { accent_6 as accent };
    }
    namespace kings_cup_nov {
        let id_7: string;
        export { id_7 as id };
        let name_7: string;
        export { name_7 as name };
        let favorite_7: string;
        export { favorite_7 as favorite };
        let license_7: string;
        export { license_7 as license };
        let sourceUrl_7: string;
        export { sourceUrl_7 as sourceUrl };
        let attribution_7: string;
        export { attribution_7 as attribution };
        let gems_7: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_7 as gems };
        let background_7: string;
        export { background_7 as background };
        let accent_7: string;
        export { accent_7 as accent };
    }
    namespace lightning_dash_dec {
        let id_8: string;
        export { id_8 as id };
        let name_8: string;
        export { name_8 as name };
        let favorite_8: string;
        export { favorite_8 as favorite };
        let license_8: string;
        export { license_8 as license };
        let sourceUrl_8: string;
        export { sourceUrl_8 as sourceUrl };
        let attribution_8: string;
        export { attribution_8 as attribution };
        let gems_8: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_8 as gems };
        let background_8: string;
        export { background_8 as background };
        let accent_8: string;
        export { accent_8 as accent };
    }
    namespace wonderful_winter_dec {
        let id_9: string;
        export { id_9 as id };
        let name_9: string;
        export { name_9 as name };
        let favorite_9: string;
        export { favorite_9 as favorite };
        let license_9: string;
        export { license_9 as license };
        let sourceUrl_9: string;
        export { sourceUrl_9 as sourceUrl };
        let attribution_9: string;
        export { attribution_9 as attribution };
        let gems_9: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_9 as gems };
        let background_9: string;
        export { background_9 as background };
        let accent_9: string;
        export { accent_9 as accent };
    }
    namespace christmas_2026 {
        let id_10: string;
        export { id_10 as id };
        let name_10: string;
        export { name_10 as name };
        let favorite_10: string;
        export { favorite_10 as favorite };
        let license_10: string;
        export { license_10 as license };
        let sourceUrl_10: string;
        export { sourceUrl_10 as sourceUrl };
        let attribution_10: string;
        export { attribution_10 as attribution };
        let gems_10: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_10 as gems };
        let background_10: string;
        export { background_10 as background };
        let accent_10: string;
        export { accent_10 as accent };
    }
    namespace team_battle_dec {
        let id_11: string;
        export { id_11 as id };
        let name_11: string;
        export { name_11 as name };
        let favorite_11: string;
        export { favorite_11 as favorite };
        let license_11: string;
        export { license_11 as license };
        let sourceUrl_11: string;
        export { sourceUrl_11 as sourceUrl };
        let attribution_11: string;
        export { attribution_11 as attribution };
        let gems_11: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_11 as gems };
        let background_11: string;
        export { background_11 as background };
        let accent_11: string;
        export { accent_11 as accent };
    }
    namespace new_year_challenge_jan {
        let id_12: string;
        export { id_12 as id };
        let name_12: string;
        export { name_12 as name };
        let favorite_12: string;
        export { favorite_12 as favorite };
        let license_12: string;
        export { license_12 as license };
        let sourceUrl_12: string;
        export { sourceUrl_12 as sourceUrl };
        let attribution_12: string;
        export { attribution_12 as attribution };
        let gems_12: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_12 as gems };
        let background_12: string;
        export { background_12 as background };
        let accent_12: string;
        export { accent_12 as accent };
    }
    namespace lunar_new_year_2027 {
        let id_13: string;
        export { id_13 as id };
        let name_13: string;
        export { name_13 as name };
        let favorite_13: string;
        export { favorite_13 as favorite };
        let license_13: string;
        export { license_13 as license };
        let sourceUrl_13: string;
        export { sourceUrl_13 as sourceUrl };
        let attribution_13: string;
        export { attribution_13 as attribution };
        let gems_13: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_13 as gems };
        let background_13: string;
        export { background_13 as background };
        let accent_13: string;
        export { accent_13 as accent };
    }
    namespace valentine_event_feb {
        let id_14: string;
        export { id_14 as id };
        let name_14: string;
        export { name_14 as name };
        let favorite_14: string;
        export { favorite_14 as favorite };
        let license_14: string;
        export { license_14 as license };
        let sourceUrl_14: string;
        export { sourceUrl_14 as sourceUrl };
        let attribution_14: string;
        export { attribution_14 as attribution };
        let gems_14: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_14 as gems };
        let background_14: string;
        export { background_14 as background };
        let accent_14: string;
        export { accent_14 as accent };
    }
    namespace womens_day_mar {
        let id_15: string;
        export { id_15 as id };
        let name_15: string;
        export { name_15 as name };
        let favorite_15: string;
        export { favorite_15 as favorite };
        let license_15: string;
        export { license_15 as license };
        let sourceUrl_15: string;
        export { sourceUrl_15 as sourceUrl };
        let attribution_15: string;
        export { attribution_15 as attribution };
        let gems_15: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_15 as gems };
        let background_15: string;
        export { background_15 as background };
        let accent_15: string;
        export { accent_15 as accent };
    }
    namespace st_patrick_mar {
        let id_16: string;
        export { id_16 as id };
        let name_16: string;
        export { name_16 as name };
        let favorite_16: string;
        export { favorite_16 as favorite };
        let license_16: string;
        export { license_16 as license };
        let sourceUrl_16: string;
        export { sourceUrl_16 as sourceUrl };
        let attribution_16: string;
        export { attribution_16 as attribution };
        let gems_16: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_16 as gems };
        let background_16: string;
        export { background_16 as background };
        let accent_16: string;
        export { accent_16 as accent };
    }
    namespace easter_mar {
        let id_17: string;
        export { id_17 as id };
        let name_17: string;
        export { name_17 as name };
        let favorite_17: string;
        export { favorite_17 as favorite };
        let license_17: string;
        export { license_17 as license };
        let sourceUrl_17: string;
        export { sourceUrl_17 as sourceUrl };
        let attribution_17: string;
        export { attribution_17 as attribution };
        let gems_17: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_17 as gems };
        let background_17: string;
        export { background_17 as background };
        let accent_17: string;
        export { accent_17 as accent };
    }
    namespace spring_bloom_apr {
        let id_18: string;
        export { id_18 as id };
        let name_18: string;
        export { name_18 as name };
        let favorite_18: string;
        export { favorite_18 as favorite };
        let license_18: string;
        export { license_18 as license };
        let sourceUrl_18: string;
        export { sourceUrl_18 as sourceUrl };
        let attribution_18: string;
        export { attribution_18 as attribution };
        let gems_18: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_18 as gems };
        let background_18: string;
        export { background_18 as background };
        let accent_18: string;
        export { accent_18 as accent };
    }
    namespace mothers_day_may {
        let id_19: string;
        export { id_19 as id };
        let name_19: string;
        export { name_19 as name };
        let favorite_19: string;
        export { favorite_19 as favorite };
        let license_19: string;
        export { license_19 as license };
        let sourceUrl_19: string;
        export { sourceUrl_19 as sourceUrl };
        let attribution_19: string;
        export { attribution_19 as attribution };
        let gems_19: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_19 as gems };
        let background_19: string;
        export { background_19 as background };
        let accent_19: string;
        export { accent_19 as accent };
    }
    namespace memorial_day_may {
        let id_20: string;
        export { id_20 as id };
        let name_20: string;
        export { name_20 as name };
        let favorite_20: string;
        export { favorite_20 as favorite };
        let license_20: string;
        export { license_20 as license };
        let sourceUrl_20: string;
        export { sourceUrl_20 as sourceUrl };
        let attribution_20: string;
        export { attribution_20 as attribution };
        let gems_20: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_20 as gems };
        let background_20: string;
        export { background_20 as background };
        let accent_20: string;
        export { accent_20 as accent };
    }
    namespace summer_splash_jun {
        let id_21: string;
        export { id_21 as id };
        let name_21: string;
        export { name_21 as name };
        let favorite_21: string;
        export { favorite_21 as favorite };
        let license_21: string;
        export { license_21 as license };
        let sourceUrl_21: string;
        export { sourceUrl_21 as sourceUrl };
        let attribution_21: string;
        export { attribution_21 as attribution };
        let gems_21: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_21 as gems };
        let background_21: string;
        export { background_21 as background };
        let accent_21: string;
        export { accent_21 as accent };
    }
    namespace independence_day_jul {
        let id_22: string;
        export { id_22 as id };
        let name_22: string;
        export { name_22 as name };
        let favorite_22: string;
        export { favorite_22 as favorite };
        let license_22: string;
        export { license_22 as license };
        let sourceUrl_22: string;
        export { sourceUrl_22 as sourceUrl };
        let attribution_22: string;
        export { attribution_22 as attribution };
        let gems_22: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_22 as gems };
        let background_22: string;
        export { background_22 as background };
        let accent_22: string;
        export { accent_22 as accent };
    }
    namespace labor_day_sep {
        let id_23: string;
        export { id_23 as id };
        let name_23: string;
        export { name_23 as name };
        let favorite_23: string;
        export { favorite_23 as favorite };
        let license_23: string;
        export { license_23 as license };
        let sourceUrl_23: string;
        export { sourceUrl_23 as sourceUrl };
        let attribution_23: string;
        export { attribution_23 as attribution };
        let gems_23: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_23 as gems };
        let background_23: string;
        export { background_23 as background };
        let accent_23: string;
        export { accent_23 as accent };
    }
    namespace halloween_oct {
        let id_24: string;
        export { id_24 as id };
        let name_24: string;
        export { name_24 as name };
        let favorite_24: string;
        export { favorite_24 as favorite };
        let license_24: string;
        export { license_24 as license };
        let sourceUrl_24: string;
        export { sourceUrl_24 as sourceUrl };
        let attribution_24: string;
        export { attribution_24 as attribution };
        let gems_24: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_24 as gems };
        let background_24: string;
        export { background_24 as background };
        let accent_24: string;
        export { accent_24 as accent };
    }
    namespace thanksgiving_nov {
        let id_25: string;
        export { id_25 as id };
        let name_25: string;
        export { name_25 as name };
        let favorite_25: string;
        export { favorite_25 as favorite };
        let license_25: string;
        export { license_25 as license };
        let sourceUrl_25: string;
        export { sourceUrl_25 as sourceUrl };
        let attribution_25: string;
        export { attribution_25 as attribution };
        let gems_25: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_25 as gems };
        let background_25: string;
        export { background_25 as background };
        let accent_25: string;
        export { accent_25 as accent };
    }
    namespace christmas_2027 {
        let id_26: string;
        export { id_26 as id };
        let name_26: string;
        export { name_26 as name };
        let favorite_26: string;
        export { favorite_26 as favorite };
        let license_26: string;
        export { license_26 as license };
        let sourceUrl_26: string;
        export { sourceUrl_26 as sourceUrl };
        let attribution_26: string;
        export { attribution_26 as attribution };
        let gems_26: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_26 as gems };
        let background_26: string;
        export { background_26 as background };
        let accent_26: string;
        export { accent_26 as accent };
    }
}
export namespace WEATHER_TILE_SETS {
    namespace clear {
        let id_27: string;
        export { id_27 as id };
        let name_27: string;
        export { name_27 as name };
        let favorite_27: string;
        export { favorite_27 as favorite };
        let license_27: string;
        export { license_27 as license };
        let sourceUrl_27: string;
        export { sourceUrl_27 as sourceUrl };
        let attribution_27: string;
        export { attribution_27 as attribution };
        let gems_27: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_27 as gems };
        let background_27: string;
        export { background_27 as background };
        let accent_27: string;
        export { accent_27 as accent };
    }
    namespace partly_cloudy {
        let id_28: string;
        export { id_28 as id };
        let name_28: string;
        export { name_28 as name };
        let favorite_28: string;
        export { favorite_28 as favorite };
        let license_28: string;
        export { license_28 as license };
        let sourceUrl_28: string;
        export { sourceUrl_28 as sourceUrl };
        let attribution_28: string;
        export { attribution_28 as attribution };
        let gems_28: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_28 as gems };
        let background_28: string;
        export { background_28 as background };
        let accent_28: string;
        export { accent_28 as accent };
    }
    namespace cloudy {
        let id_29: string;
        export { id_29 as id };
        let name_29: string;
        export { name_29 as name };
        let favorite_29: string;
        export { favorite_29 as favorite };
        let license_29: string;
        export { license_29 as license };
        let sourceUrl_29: string;
        export { sourceUrl_29 as sourceUrl };
        let attribution_29: string;
        export { attribution_29 as attribution };
        let gems_29: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_29 as gems };
        let background_29: string;
        export { background_29 as background };
        let accent_29: string;
        export { accent_29 as accent };
    }
    namespace rain {
        let id_30: string;
        export { id_30 as id };
        let name_30: string;
        export { name_30 as name };
        let favorite_30: string;
        export { favorite_30 as favorite };
        let license_30: string;
        export { license_30 as license };
        let sourceUrl_30: string;
        export { sourceUrl_30 as sourceUrl };
        let attribution_30: string;
        export { attribution_30 as attribution };
        let gems_30: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_30 as gems };
        let background_30: string;
        export { background_30 as background };
        let accent_30: string;
        export { accent_30 as accent };
    }
    namespace snow {
        let id_31: string;
        export { id_31 as id };
        let name_31: string;
        export { name_31 as name };
        let favorite_31: string;
        export { favorite_31 as favorite };
        let license_31: string;
        export { license_31 as license };
        let sourceUrl_31: string;
        export { sourceUrl_31 as sourceUrl };
        let attribution_31: string;
        export { attribution_31 as attribution };
        let gems_31: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_31 as gems };
        let background_31: string;
        export { background_31 as background };
        let accent_31: string;
        export { accent_31 as accent };
    }
    namespace sleet {
        let id_32: string;
        export { id_32 as id };
        let name_32: string;
        export { name_32 as name };
        let favorite_32: string;
        export { favorite_32 as favorite };
        let license_32: string;
        export { license_32 as license };
        let sourceUrl_32: string;
        export { sourceUrl_32 as sourceUrl };
        let attribution_32: string;
        export { attribution_32 as attribution };
        let gems_32: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_32 as gems };
        let background_32: string;
        export { background_32 as background };
        let accent_32: string;
        export { accent_32 as accent };
    }
    namespace storm {
        let id_33: string;
        export { id_33 as id };
        let name_33: string;
        export { name_33 as name };
        let favorite_33: string;
        export { favorite_33 as favorite };
        let license_33: string;
        export { license_33 as license };
        let sourceUrl_33: string;
        export { sourceUrl_33 as sourceUrl };
        let attribution_33: string;
        export { attribution_33 as attribution };
        let gems_33: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_33 as gems };
        let background_33: string;
        export { background_33 as background };
        let accent_33: string;
        export { accent_33 as accent };
    }
    namespace fog {
        let id_34: string;
        export { id_34 as id };
        let name_34: string;
        export { name_34 as name };
        let favorite_34: string;
        export { favorite_34 as favorite };
        let license_34: string;
        export { license_34 as license };
        let sourceUrl_34: string;
        export { sourceUrl_34 as sourceUrl };
        let attribution_34: string;
        export { attribution_34 as attribution };
        let gems_34: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_34 as gems };
        let background_34: string;
        export { background_34 as background };
        let accent_34: string;
        export { accent_34 as accent };
    }
}
export namespace HOLIDAY_TILE_SETS {
    namespace new_years_day {
        let id_35: string;
        export { id_35 as id };
        let name_35: string;
        export { name_35 as name };
        let favorite_35: string;
        export { favorite_35 as favorite };
        let license_35: string;
        export { license_35 as license };
        let sourceUrl_35: string;
        export { sourceUrl_35 as sourceUrl };
        let attribution_35: string;
        export { attribution_35 as attribution };
        let gems_35: {
            id: string;
            color: string;
            shape: string;
            symbol: string;
        }[];
        export { gems_35 as gems };
        let background_35: string;
        export { background_35 as background };
        let accent_35: string;
        export { accent_35 as accent };
    }
}
//# sourceMappingURL=tile-sets.d.ts.map