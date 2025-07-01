import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';
import { ValidationError } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Local = 'local',
  Test = 'test',
  Provision = 'provision',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  SECRET: string;

  @IsNumber()
  DATABASE_PORT: number;

  @IsString()
  DATABASE_HOST: string;

  @IsString()
  DATABASE_USENAME: string;

  @IsString()
  DATABASE_PWD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  EMAIL_HOST: string;

  @IsNumber()
  EMAIL_PORT: number;

  @IsString()
  EMAIL_USER: string;

  @IsString()
  EMAIL_PASSWORD: string;

  @IsString()
  FRONT_END_URL: string;
}

export function validate(config: Record<string, unknown>) {
  // console.log('config: ', config);

  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  // console.log(validatedConfig);

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  // if (errors.length > 0) {
  //   const errorMessages = errors
  //     .map((err: ValidationError) => {
  //       const constraints = err.constraints
  //         ? Object.values(err.constraints).join(', ')
  //         : 'Unknown error';
  //       return `${err.property}: ${constraints}`;
  //     })
  //     .join(' | ');
  //   throw new Error(`Environment validation error(s): ${errorMessages}`);
  // }

  return validatedConfig;
}
