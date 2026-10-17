import { Module } from "@nestjs/common";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { CsrfGuard } from "./auth/csrf.guard";
import { RolesGuard } from "./auth/roles.guard";
import { SessionAuthGuard } from "./auth/session-auth.guard";
import { AdmissionController } from "./modules/admission/admission.controller";
import { AdmissionService } from "./modules/admission/admission.service";
import { EventsController } from "./modules/events/events.controller";
import { HealthController } from "./modules/health/health.controller";
import { OrdersController } from "./modules/orders/orders.controller";
import { OrdersService } from "./modules/orders/orders.service";
import { PrismaService } from "./platform/prisma.service";
import { RateLimitGuard } from "./platform/rate-limit.guard";
import { RateLimitService } from "./platform/rate-limit.service";

@Module({
  controllers: [
    AuthController,
    HealthController,
    EventsController,
    OrdersController,
    AdmissionController,
  ],
  providers: [
    PrismaService,
    AuthService,
    SessionAuthGuard,
    CsrfGuard,
    RolesGuard,
    OrdersService,
    AdmissionService,
    RateLimitService,
    RateLimitGuard,
  ],
})
export class AppModule {}
