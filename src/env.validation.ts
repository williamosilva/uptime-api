import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsNotEmpty()
  @IsString()
  FRONTEND_URL_HEALTH_CHECK: string;

  @IsNotEmpty()
  @IsString()
  BACKEND_URL_HEALTH_CHECK: string;

  @IsNotEmpty()
  @IsString()
  SUPABASE_URL_HEALTH_CHECK: string;

  @IsNotEmpty()
  @IsString()
  SUPABASE_ANON_KEY_HEALTH_CHECK: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
