export const ConsentService: ConsentServiceImpl;
export default ConsentService;
declare class ConsentServiceImpl {
    userIdToConsent: Map<any, any>;
    setConsent(userId: any, partial: any): Promise<any>;
    getDefault(): {
        adsAllowed: boolean;
        npa: boolean;
        gdpr: null;
        att: string;
    };
    getConsent(userId: any): Promise<any>;
}
//# sourceMappingURL=ConsentService.d.ts.map