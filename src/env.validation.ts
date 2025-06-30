import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsNotEmpty()
  @IsString()
  FRONTEND_URL: string;

  @IsNotEmpty()
  @IsString()
  BACKEND_URL: string;

  @IsNotEmpty()
  @IsString()
  SUPABASE_URL: string;

  @IsNotEmpty()
  @IsString()
  SUPABASE_ANON_KEY: string;
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
