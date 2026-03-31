import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { TokenService } from "src/modules/identity/application/services/token.service";

import { AuthenticatedCustomer } from "./authenticated-customer.interface";

@Injectable()
export class CustomerAccessTokenGuard implements CanActivate {
  constructor(
    @Inject(TokenService) private readonly tokenService: TokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{
        headers: Record<string, string | undefined>;
        customer?: AuthenticatedCustomer;
      }>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      const payload = this.tokenService.verifyAccessToken(
        authorization.slice("Bearer ".length),
      );
      request.customer = {
        customerId: payload.sub,
        tenantId: payload.tenantId,
        sessionId: payload.sessionId,
      };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid customer access token");
    }
  }
}
