import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { AuthenticatedUser } from "./authenticated-user.interface";

export const AuthUser = createParamDecorator(
  (_: unknown, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();

    return request.user;
  },
);
