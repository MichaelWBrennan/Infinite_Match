export function isDurableEconomy(): boolean;
/**
 * Production keeps player balances in the database. Without ECONOMY_STORE=mongo they live in
 * memory and are lost on restart, so the server refuses to start rather than run that way.
 */
export function assertEconomyStoreForEnvironment(env?: NodeJS.ProcessEnv): void;
export namespace PlayerEconomyDb {
    function load(playerId: any): Promise<any>;
    function save(playerId: any, economy: any): Promise<void>;
}
export default PlayerEconomyDb;
//# sourceMappingURL=PlayerEconomyDb.d.ts.map