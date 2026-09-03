"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
require("dotenv/config");
const swagger_setup_1 = require("./config/swagger/swagger.setup");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const httpServer = app.getHttpAdapter().getInstance();
    if (httpServer?.use) {
        httpServer.use((req, _res, next) => {
            const u = req.url ?? '';
            if (u.startsWith('/tenant/') && !u.startsWith('/api/')) {
                req.url = `/api${u}`;
            }
            next();
        });
    }
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const productionOrigins = [
        'https://divino.sinergydigital.mx',
    ];
    const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
    let selfInvoicePortalOrigin = null;
    try {
        const portalBase = process.env.SELF_INVOICE_PORTAL_BASE_URL?.trim();
        if (portalBase) {
            selfInvoicePortalOrigin = new URL(portalBase).origin;
        }
    }
    catch {
        selfInvoicePortalOrigin = null;
    }
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            if (process.env.NODE_ENV !== 'production' && localDevOriginPattern.test(origin)) {
                callback(null, true);
                return;
            }
            if (productionOrigins.includes(origin) ||
                origin === selfInvoicePortalOrigin ||
                /^https:\/\/([a-z0-9-]+\.)?sinergydigital\.mx$/.test(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
            'X-Tenant-ID',
            'Cache-Control',
            'Pragma',
            'Expires',
        ],
        exposedHeaders: ['Authorization'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    app.setGlobalPrefix('api');
    (0, swagger_setup_1.setupSwagger)(app);
    const port = Number(process.env.APP_PORT) || 3000;
    console.log(`[BOOTSTRAP] Starting server on port ${port}...`);
    await app.listen(port);
    console.log(`[BOOTSTRAP] Server is running on port ${port}`);
}
bootstrap().catch(err => {
    console.error('[BOOTSTRAP] Error starting server:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map