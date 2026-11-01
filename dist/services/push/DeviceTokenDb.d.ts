export namespace DeviceTokenDb {
    function upsert({ userId, token, platform, locale }: {
        userId: any;
        token: any;
        platform: any;
        locale: any;
    }): Promise<void>;
    /** All device tokens registered for a user. Returns [{ token, platform, locale }]. */
    function findByUserId(userId: any): Promise<any>;
}
export default DeviceTokenDb;
//# sourceMappingURL=DeviceTokenDb.d.ts.map