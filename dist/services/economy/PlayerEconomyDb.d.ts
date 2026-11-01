export function isDurableEconomy(): boolean;
/**
 * Production keeps player balances in the database. Without ECONOMY_STORE=mongo they live in
 * memory and are lost on restart, so the server refuses to start rather than run that way.
 */
export function assertEconomyStoreForEnvironment(env?: NodeJS.ProcessEnv): void;
export namespace PlayerEconomyDb {
    function load(playerId: any): Promise<any>;
    function insertIfAbsent(playerId: any, economy: any): Promise<boolean>;
    function save(playerId: any, economy: any): Promise<boolean>;
    function saveIfPending(playerId: any, attemptId: any, economy: any): Promise<boolean>;
}
export default PlayerEconomyDb;
//# sourceMappingURL=PlayerEconomyDb.d.ts.map