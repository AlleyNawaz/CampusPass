import { Module } from "@nestjs/common";
import { AdmissionController } from "./modules/admission/admission.controller";
import { AdmissionService } from "./modules/admission/admission.service";
import { EventsController } from "./modules/events/events.controller";
import { HealthController } from "./modules/health/health.controller";
import { OrdersController } from "./modules/orders/orders.controller";
import { OrdersService } from "./modules/orders/orders.service";
import { PrismaService } from "./platform/prisma.service";

@Module({
  controllers: [
    HealthController,
    EventsController,
    OrdersController,
    AdmissionController,
  ],
  providers: [PrismaService, OrdersService, AdmissionService],
})
export class AppModule {}
