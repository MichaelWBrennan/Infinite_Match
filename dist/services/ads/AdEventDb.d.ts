export namespace AdEventDb {
    function record(doc: any): Promise<void>;
    function metrics({ days, country, format }: {
        days?: number | undefined;
        country: any;
        format: any;
    }): Promise<any>;
}
export default AdEventDb;
//# sourceMappingURL=AdEventDb.d.ts.map