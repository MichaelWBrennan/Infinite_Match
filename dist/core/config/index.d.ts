export namespace AppConfig {
    namespace server {
        let port: string | number;
        let host: string;
        let environment: string;
        namespace cors {
            let origin: string[];
            let credentials: boolean;
        }
    }
    namespace security {
        namespace jwt {
            let secret: string;
            let expiresIn: string;
        }
        namespace bcrypt {
            let rounds: number;
        }
        namespace rateLimit {
            let windowMs: number;
            let max: number;
        }
        namespace encryption {
            let algorithm: string;
            let key: string;
        }
    }
    namespace unity {
        let projectId: string;
        let environmentId: string;
        let clientId: string;
        let clientSecret: string;
    }
    namespace database {
        let url: string;
        namespace options {
            let useNewUrlParser: boolean;
            let useUnifiedTopology: boolean;
        }
    }
    namespace logging {
        let level: string;
        let format: string;
        namespace file {
            let enabled: boolean;
            let path: string;
            let maxSize: string;
            let maxFiles: string;
        }
    }
    namespace cache {
        export namespace ttl {
            let receipt: number;
            let segments: number;
        }
        let maxSize_1: number;
        export { maxSize_1 as maxSize };
    }
    namespace paths {
        let root: string;
        let assets: string;
        let config: string;
        let logs: string;
        let temp: string;
    }
}
export default AppConfig;
//# sourceMappingURL=index.d.ts.map