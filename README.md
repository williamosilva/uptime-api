<div align="center">

# UpTime - Backend API

Real-time service monitoring API built with NestJS for monitoring Frontend, Backend, and Supabase services.

## About the Project

UpTime Backend is a robust health monitoring API that provides real-time status checking for multiple services. Built with NestJS, it offers automatic health checks with configurable intervals, data retention, and comprehensive monitoring capabilities.

## System Integration

This backend API works seamlessly with the [UpTime Frontend](https://github.com/williamosilva/uptime-app) to provide a complete monitoring solution. When both applications are properly configured with matching environment variables, they create a powerful real-time monitoring dashboard that displays service health status, historical data, and performance metrics.

![UpTime System Demo](https://i.imgur.com/IDbBjFY.gif)

*Complete UpTime monitoring system in action - Frontend + Backend working together*

</div>

## Features

- 🔍 **Multi-Service Monitoring**: Monitor Frontend, Backend, and Supabase services
- ⏰ **Configurable Intervals**: Set custom health check intervals
- 📊 **Swagger Documentation**: Interactive API documentation available at root path
- 🗄️ **Data Persistence**: Store health check results in Supabase
- 🔄 **Automatic Cleanup**: Configurable data retention periods
- 🐳 **Docker Support**: Full Docker and Docker Compose support
- 🌐 **Frontend Integration**: Perfect integration with UpTime Frontend dashboard

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account and project
- Docker (optional, for containerized deployment)

## Setup

### 1. Create and Configure Supabase Project

Before running the application, you need to set up Supabase:

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Set up the necessary tables for storing health check data
3. Get your project URL and anon key from the Supabase dashboard
4. Keep these credentials ready for the environment configuration

### 2. Clone the repository
```bash
git clone https://github.com/williamosilva/uptime-api
cd uptime-api
```

### 3. Install dependencies
```bash
npm install
# or
yarn install
```

### 4. Configure environment variables
Create a `.env` file in the project root:

```env
# Server Configuration
PORT=3000 # Port where the API will run (default: 3000)

# Environment
NODE_ENV=development or production

# Connection to Supabase to save pings (REQUIRED - Configure first)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON=your_supabase_anon_key

# Target values for Up Time monitoring
FRONTEND_URL_HEALTH_CHECK=https://your-frontend.com
BACKEND_URL_HEALTH_CHECK=https://your-api.com
SUPABASE_URL_HEALTH_CHECK=https://your-project.supabase.co
SUPABASE_ANON_KEY_HEALTH_CHECK=your_supabase_anon_key

# Cron settings (optional - default values)
HEALTH_CHECK_INTERVAL_MINUTES=5 # Interval in minutes (default: 5)
HEALTH_CHECK_RETENTION_DAYS=30 # Days to keep records (default: 30)

# Origins allowed for CORS (Comma separated for multiple origins)
CORS_ORIGIN=http://localhost:3000,https://your-frontend.com
```

**⚠️ Important**: 
- Configure `SUPABASE_URL` and `SUPABASE_ANON` first - these are required for the application to start
- The `*_HEALTH_CHECK` variables can be configured later or omitted if you don't want to monitor those specific services
- Make sure the `PORT` matches the API endpoint configured in your frontend application
- For complete system functionality, deploy both backend and frontend with matching environment configurations

## Configuration Details

### Server Configuration

- **PORT**: The port where the API server will run (default: 3000)

### Supabase Configuration (Required)

The application requires Supabase for data persistence:

- **SUPABASE_URL**: Your Supabase project URL for storing health check data
- **SUPABASE_ANON**: Your Supabase anon key for API access
- **SUPABASE_URL_HEALTH_CHECK**: Same as SUPABASE_URL (for monitoring Supabase itself)
- **SUPABASE_ANON_KEY_HEALTH_CHECK**: Same as SUPABASE_ANON (for monitoring)

### Service Monitoring Configuration (Optional)

Configure the URLs for each service you want to monitor:

- **FRONTEND_URL_HEALTH_CHECK**: Your frontend application URL
- **BACKEND_URL_HEALTH_CHECK**: Your backend API health endpoint
- **SUPABASE_URL_HEALTH_CHECK**: Your Supabase project URL

### Health Check Settings

- **HEALTH_CHECK_INTERVAL_MINUTES**: How often to perform health checks (default: 5 minutes)
- **HEALTH_CHECK_RETENTION_DAYS**: How long to keep health check records (default: 30 days)

### CORS Configuration

Set `CORS_ORIGIN` with comma-separated origins that should have access to the API:
```env
CORS_ORIGIN=http://localhost:3000,https://your-domain.com
```

## Running the Project

### Development
```bash
npm run start:dev
# or
yarn start:dev
```

### Production
```bash
npm run build
npm run start:prod
# or
yarn build
yarn start:prod
```

### Docker Compose (Recommended)

#### Production
```bash
# Build and start the production container
docker-compose up -d

# View logs
docker-compose logs -f uptime-api

# Stop the container
docker-compose down
```

#### Development
```bash
# Build and start the development container with hot reload
docker-compose --profile dev up -d uptime-api-dev

# View logs
docker-compose logs -f uptime-api-dev

# Stop the development container
docker-compose --profile dev down
```

The API will be available at `http://localhost:3000` (or the port specified in your PORT environment variable)

## API Documentation

Access the interactive Swagger documentation at: `http://localhost:3000` (or your configured port)

### Health Check Endpoints

#### Individual Service Checks
- **`GET /health/frontend`** - Check frontend service health
- **`GET /health/backend`** - Check backend service health  
- **`GET /health/supabase`** - Check Supabase service health
- **`GET /health`** - Check all services health

#### Management Endpoints
- **`POST /health/check-now`** - Execute manual health check and save to database
- **`GET /health/cron-status`** - Get cron job status information

#### Historical Data Endpoints
- **`GET /health/history/last-days`** - Get health checks from the last X days
  - Query params: `days` (required), `filter` (optional: frontend|backend|supabase)
  - Example: `/health/history/last-days?days=7&filter=backend`

- **`GET /health/history/range`** - Get health checks for a date range
  - Query params: `startDays` (required), `endDays` (optional), `filter` (optional)
  - Example: `/health/history/range?startDays=30&endDays=7&filter=frontend`

#### Statistics Endpoints
- **`GET /health/stats/last-days`** - Get health check statistics for the last X days
  - Query params: `days` (required)
  - Example: `/health/stats/last-days?days=7`

### Response Formats

#### Individual Service Check Response
```json
{
  "status": "ok" | "degraded" | "down",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "frontend": {
      "status": "ok" | "degraded" | "down" | "absent",
      "responseTimeMs": 150,
      "error": "Error message (if any)"
    }
  }
}
```

#### All Services Check Response
```json
{
  "status": "ok" | "degraded" | "down",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "frontend": {
      "status": "ok" | "degraded" | "down" | "absent",
      "responseTimeMs": 150,
      "error": "Error message (if any)"
    },
    "backend": {
      "status": "ok" | "degraded" | "down" | "absent", 
      "responseTimeMs": 75
    },
    "supabase": {
      "status": "ok" | "degraded" | "down" | "absent",
      "responseTimeMs": 200
    }
  }
}
```

#### Manual Check Response
```json
{
  "success": true,
  "message": "Manual health check executed and saved successfully"
}
```

#### Cron Status Response
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "nextExecution": "2024-01-01T00:05:00.000Z",
    "lastExecution": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Historical Data Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "overall_status": "ok",
      "frontend_status": "ok",
      "frontend_response_time": 150,
      "backend_status": "ok",
      "backend_response_time": 75,
      "supabase_status": "ok",
      "supabase_response_time": 200,
      "checked_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "period": {
    "days": 7,
    "startDate": "2024-01-01",
    "endDate": "2024-01-07"
  },
  "filter": "all"
}
```

#### Statistics Response
```json
{
  "success": true,
  "data": {
    "totalChecks": 100,
    "statusCounts": {
      "ok": 95,
      "degraded": 3,
      "down": 2
    },
    "services": {
      "frontend": {
        "url": "https://your-frontend.com",
        "avgResponseTime": 150.5,
        "uptime": 98.5
      },
      "backend": {
        "url": "https://your-api.com",
        "avgResponseTime": 75.2,
        "uptime": 99.0
      },
      "supabase": {
        "url": "https://your-project.supabase.co",
        "avgResponseTime": 200.1,
        "uptime": 97.5
      }
    }
  },
  "period": {
    "days": 7,
    "startDate": "2024-01-01",
    "endDate": "2024-01-07"
  }
}
```

### HTTP Status Codes

- **200 OK**: Service is operational or request successful
- **400 Bad Request**: Invalid query parameters
- **500 Internal Server Error**: Server error during operation
- **503 Service Unavailable**: Service is down or unavailable

## Health Check Logic

- **OK**: Service responds within acceptable time limits
- **Degraded**: Service responds but with higher than normal response times
- **Down**: Service is unreachable or returns error responses
- **Absent**: Service URL not configured

## Contributing

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Note**: This backend API works perfectly with the [UpTime Frontend](https://github.com/williamosilva/uptime-app). Make sure both applications are configured with matching environment variables for complete system functionality.

---

<div align="center">
  
**Developed by** [William Silva](https://williamsilva.dev)

</div>