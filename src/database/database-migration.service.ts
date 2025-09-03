import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseMigrationService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseMigrationService.name);
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error(
        'Supabase credentials not found in environment variables',
      );
      throw new Error('Supabase credentials missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async onModuleInit() {
    this.logger.log('Checking database setup...');
    await this.checkRequiredTables();
  }

  private async checkRequiredTables(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('health_checks')
        .select('id')
        .limit(1);

      if (error && error.message.includes('Could not find the table')) {
        this.logger.error('TABLE health_checks DOES NOT EXIST!');
        this.logger.error('');
        this.logger.error('ACTION REQUIRED:');
        this.logger.error('1. Access Supabase Dashboard');
        this.logger.error('2. Go to SQL Editor');
        this.logger.error('3. Copy content from file: database/schema.sql');
        this.logger.error('4. Execute the SQL in Supabase');
        this.logger.error('5. Restart the application');
        this.logger.error('');
        this.logger.error('SQL file location: database/schema.sql');

        throw new Error('Required database table missing: health_checks');
      } else if (error) {
        this.logger.error('Unexpected database error:', error);
        throw error;
      } else {
        this.logger.log('Database setup OK - health_checks table exists');
      }
    } catch (error) {
      this.logger.error('Error checking database setup:', error);
      throw error;
    }
  }

  async checkTablesExist(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('health_checks')
        .select('id')
        .limit(1);

      return !error || !error.message.includes('Could not find the table');
    } catch (error) {
      this.logger.error('Error checking if tables exist:', error);
      return false;
    }
  }
}
