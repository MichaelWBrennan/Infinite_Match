export class PricingService {
    constructor(tiersPath?: string, overridesPath?: any);
    tiersPath: string;
    overridesPath: any;
    loadJson(path: any, fallback?: {}): Promise<any>;
    normalizeCurrency(currency: any, country: any): any;
    computeLocalizedPrice(usdPrice: any, currency: any): {
        amount: any;
        currency: any;
    };
    roundPrice(amount: any): any;
    getLocalizedTiers({ country, currency }: {
        country: any;
        currency: any;
    }): Promise<any>;
}
export default PricingService;
//# sourceMappingURL=PricingService.d.ts.map