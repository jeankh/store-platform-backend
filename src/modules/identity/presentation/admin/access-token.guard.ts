import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { TokenService } from "../../application/services/token.service";
import { AuthenticatedUser } from "./authenticated-user.interface";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(TokenService) private readonly tokenService: TokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthenticatedUser;
    }>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authorization.slice("Bearer ".length);

    try {
      const payload = this.tokenService.verifyAccessToken(token);

      request.user = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        sessionId: payload.sessionId,
      };

      return true;
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }
  }
}
