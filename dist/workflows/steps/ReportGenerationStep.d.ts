export class ReportGenerationStep {
    name: string;
    execute(state: any): Promise<{
        success: boolean;
        reportPath: string;
        report: {
            timestamp: string;
            workflow: {
                status: string;
                steps: string[];
            };
            health: any;
            deployment: any;
            economy: any;
            system: {
                memory: NodeJS.MemoryUsage;
                uptime: number;
                cacheStats: any;
            };
        };
    }>;
}
export default ReportGenerationStep;
//# sourceMappingURL=ReportGenerationStep.d.ts.map