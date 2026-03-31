import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { AuthenticatedCustomer } from "./authenticated-customer.interface";

export const AuthCustomer = createParamDecorator(
  (_: unknown, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<{ customer: AuthenticatedCustomer }>();
    return request.customer;
  },
);
