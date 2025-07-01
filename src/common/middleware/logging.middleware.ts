import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  private getUserIdentifier(
    user: User | undefined,
    isAuthRoute: boolean,
  ): string {
    if (user) {
      return user.email ? `${user.email} (ID: ${user.id})` : `ID: ${user.id}`;
    }
    return isAuthRoute ? 'Authenticating' : 'Anonymous';
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;

    const isAuthRoute = originalUrl.startsWith('/auth');
    const user = req.user as User;
    const userIdentifier = this.getUserIdentifier(user, isAuthRoute);

    this.logger.log(`→ ${method} ${originalUrl} (user: ${userIdentifier})`);

    const now = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - now;
      // Check again after request processing in case user was set during auth
      const finalUser = req.user as User;
      const finalUserIdentifier = this.getUserIdentifier(
        finalUser,
        isAuthRoute,
      );

      this.logger.log(
        `← ${method} ${originalUrl} ${res.statusCode} - ${ms}ms (user: ${finalUserIdentifier})`,
      );
    });

    next();
  }
}
