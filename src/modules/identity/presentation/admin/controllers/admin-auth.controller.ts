import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AuthService } from "../../../application/services/auth.service";
import { AccessTokenGuard } from "../access-token.guard";
import { AuthUser } from "../auth-user.decorator";
import { AuthenticatedUser } from "../authenticated-user.interface";
import { BootstrapAdminDto } from "../dto/bootstrap-admin.dto";
import { LoginDto } from "../dto/login.dto";
import { LogoutDto } from "../dto/logout.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("bootstrap")
  bootstrap(@Body() body: BootstrapAdminDto) {
    return this.authService.bootstrapAdmin(body);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body);
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Body() body: LogoutDto) {
    await this.authService.logout(body);
  }

  @Get("me")
  @UseGuards(AccessTokenGuard)
  me(@AuthUser() user: AuthenticatedUser) {
    return this.authService.getCurrentProfile(user.userId);
  }
}
