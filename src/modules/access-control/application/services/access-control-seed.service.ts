import { Injectable, OnModuleInit } from "@nestjs/common";

import { AccessControlService } from "./access-control.service";

@Injectable()
export class AccessControlSeedService implements OnModuleInit {
  constructor(private readonly accessControlService: AccessControlService) {}

  async onModuleInit() {
    await this.accessControlService.seedSystemPermissions();
  }
}
