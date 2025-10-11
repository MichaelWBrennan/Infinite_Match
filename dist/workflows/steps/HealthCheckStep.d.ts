export class HealthCheckStep {
    name: string;
    execute(state: any): Promise<{
        status: string;
        checks: {
            economy: {
                status: string;
                data: any;
            };
            unity: {
                status: string;
                authenticated: any;
            };
            system: {
                status: string;
                memory: {
                    rss: number;
                    heapTotal: number;
                    heapUsed: number;
                };
                uptime: number;
            };
        };
        timestamp: string;
    }>;
}
export default HealthCheckStep;
//# sourceMappingURL=HealthCheckStep.d.ts.map