/**
 * Economy Deploy Workflow Step
 * Deploys economy data to Unity Services
 */
import { Logger } from 'core/logger/index.js';
import { getService } from 'core/services/ServiceRegistry.js';
const logger = new Logger('EconomyDeployStep');
export class EconomyDeployStep {
    constructor() {
        this.name = 'economyDeploy';
    }
    async execute(state) {
        logger.info('Starting economy deployment...');
        try {
            const economyService = getService('economyService');
            const unityService = getService('unityService');
            // Get economy data from state or load it
            let economyData = state.get('economyData');
            if (!economyData) {
                economyData = await economyService.loadEconomyData();
                state.set('economyData', economyData);
            }
            logger.info('Economy data loaded', {
                currencies: economyData.currencies.length,
                inventory: economyData.inventory.length,
                catalog: economyData.catalog.length,
            });
            // Deploy to Unity Services using comprehensive method
            const deployResults = await unityService.deployAllServices();
            const result = {
                success: deployResults.economy.success,
                method: deployResults.economy.method,
                currenciesDeployed: deployResults.economy.result?.currencies?.length || 0,
                inventoryDeployed: deployResults.economy.result?.inventory?.length || 0,
                catalogDeployed: deployResults.economy.result?.catalog?.length || 0,
                errors: deployResults.economy.result?.errors || [],
                message: deployResults.economy.result?.message ||
                    'Economy deployment completed',
                timestamp: new Date().toISOString(),
            };
            // Store results in state
            state.set('deployResults', result);
            logger.info('Economy deployment completed', {
                currenciesDeployed: result.currenciesDeployed,
                inventoryDeployed: result.inventoryDeployed,
                catalogDeployed: result.catalogDeployed,
                errors: result.errors.length,
            });
            return result;
        }
        catch (error) {
            logger.error('Economy deployment failed', { error: error.message });
            throw error;
        }
    }
}
export default EconomyDeployStep;
//# sourceMappingURL=EconomyDeployStep.js.map