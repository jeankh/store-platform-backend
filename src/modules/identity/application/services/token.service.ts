import { Injectable } from "@nestjs/common";
import { createHmac, randomUUID } from "node:crypto";

type TokenType = "access" | "refresh";

type TokenPayload = {
  sub: string;
  tenantId: string;
  sessionId: string;
  type: TokenType;
  exp: number;
  jti: string;
};

type CreateTokenPairInput = {
  userId: string;
  tenantId: string;
  sessionId: string;
  accessTtlSeconds?: number;
  refreshTtlSeconds?: number;
};

type VerifyRefreshTokenInput = {
  token: string;
  revokedAt?: Date | null;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  accessPayload: TokenPayload;
  refreshPayload: TokenPayload;
};

@Injectable()
export class TokenService {
  private readonly accessSecret =
    process.env.JWT_ACCESS_SECRET || "change-me-access";
  private readonly refreshSecret =
    process.env.JWT_REFRESH_SECRET || "change-me-refresh";

  createTokenPair(input: CreateTokenPairInput): TokenPair {
    const accessPayload = this.createPayload({
      userId: input.userId,
      tenantId: input.tenantId,
      sessionId: input.sessionId,
      type: "access",
      ttlSeconds: input.accessTtlSeconds ?? 900,
    });

    const refreshPayload = this.createPayload({
      userId: input.userId,
      tenantId: input.tenantId,
      sessionId: input.sessionId,
      type: "refresh",
      ttlSeconds: input.refreshTtlSeconds ?? 60 * 60 * 24 * 30,
    });

    return {
      accessToken: this.sign(accessPayload, this.accessSecret),
      refreshToken: this.sign(refreshPayload, this.refreshSecret),
      accessPayload,
      refreshPayload,
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.verify(token, this.accessSecret, "access");
  }

  verifyRefreshToken(input: VerifyRefreshTokenInput): TokenPayload {
    if (input.revokedAt) {
      throw new Error("Refresh token has been revoked");
    }

    return this.verify(input.token, this.refreshSecret, "refresh");
  }

  private createPayload(input: {
    userId: string;
    tenantId: string;
    sessionId: string;
    type: TokenType;
    ttlSeconds: number;
  }): TokenPayload {
    const nowInSeconds = Math.floor(Date.now() / 1000);

    return {
      sub: input.userId,
      tenantId: input.tenantId,
      sessionId: input.sessionId,
      type: input.type,
      exp: nowInSeconds + input.ttlSeconds,
      jti: randomUUID(),
    };
  }

  private sign(payload: TokenPayload, secret: string): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      "base64url",
    );
    const signature = createHmac("sha256", secret)
      .update(encodedPayload)
      .digest("base64url");

    return `${encodedPayload}.${signature}`;
  }

  private verify(
    token: string,
    secret: string,
    expectedType: TokenType,
  ): TokenPayload {
    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) {
      throw new Error("Invalid token format");
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(encodedPayload)
      .digest("base64url");

    if (signature !== expectedSignature) {
      throw new Error("Invalid token signature");
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as TokenPayload;
    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (payload.type !== expectedType) {
      throw new Error("Invalid token type");
    }

    if (payload.exp <= nowInSeconds) {
      throw new Error("Token has expired");
    }

    return payload;
  }
}
