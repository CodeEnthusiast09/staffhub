import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;

    const user = req.user as User;

    const userId = user?.id ?? 'Anonymous';

    // Before response
    this.logger.log(`→ ${method} ${originalUrl} (user: ${userId})`);

    // Hook into response finish to log status code and timing
    const now = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - now;
      this.logger.log(
        `← ${method} ${originalUrl} ${res.statusCode} - ${ms}ms (user: ${userId})`,
      );
    });

    next();
  }
}
