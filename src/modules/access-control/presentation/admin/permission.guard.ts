import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AuthenticatedUser } from "src/modules/identity/presentation/admin/authenticated-user.interface";

import { AccessControlService } from "../../application/services/access-control.service";
import { REQUIRED_PERMISSION_KEY } from "./require-permission.decorator";

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly reflector = new Reflector();

  constructor(
    @Inject(AccessControlService)
    private readonly accessControlService: AccessControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      REQUIRED_PERMISSION_KEY,
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    await this.accessControlService.ensurePermission(
      request.user.userId,
      requiredPermission,
    );

    return true;
  }
}
