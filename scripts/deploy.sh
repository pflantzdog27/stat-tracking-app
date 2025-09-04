#!/bin/bash

# Production deployment script for Hockey Stats Tracking App
# This script handles building, testing, and deploying the application

set -euo pipefail

# Configuration
APP_NAME="stat-tracking-app"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
BUILD_NUMBER="${BUILD_NUMBER:-$(date +%Y%m%d%H%M%S)}"
LOG_FILE="/tmp/deploy_${BUILD_NUMBER}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    error "$1"
    exit 1
}

# Parse command line arguments
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false
ROLLBACK=false
TARGET_ENV="production"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --env)
            TARGET_ENV="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --skip-tests     Skip running tests"
            echo "  --skip-build     Skip building the application"
            echo "  --dry-run        Show what would be deployed without actually deploying"
            echo "  --rollback       Rollback to previous deployment"
            echo "  --env ENV        Target environment (default: production)"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validation
if [[ ! -f "package.json" ]]; then
    error_exit "package.json not found. Are you in the right directory?"
fi

if [[ ! -f "docker-compose.yml" ]]; then
    error_exit "docker-compose.yml not found"
fi

log "Starting deployment for ${APP_NAME} to ${TARGET_ENV}"
log "Build number: ${BUILD_NUMBER}"
log "Log file: ${LOG_FILE}"

# Handle rollback
if [[ "$ROLLBACK" == true ]]; then
    log "Performing rollback..."
    
    # Get previous deployment
    PREVIOUS_IMAGE=$(docker images ${APP_NAME} --format "table {{.Repository}}\t{{.Tag}}" | grep -v TAG | sed -n '2p' | awk '{print $2}')
    
    if [[ -z "$PREVIOUS_IMAGE" ]]; then
        error_exit "No previous deployment found to rollback to"
    fi
    
    log "Rolling back to image: ${PREVIOUS_IMAGE}"
    
    # Update docker-compose to use previous image
    sed -i.bak "s|image: ${APP_NAME}:.*|image: ${APP_NAME}:${PREVIOUS_IMAGE}|" docker-compose.yml
    
    # Restart services
    docker-compose down
    docker-compose up -d
    
    success "Rollback completed"
    exit 0
fi

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check if required environment variables are set
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "API_SECRET_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        error_exit "Required environment variable $var is not set"
    fi
done

# Check disk space
AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [[ "$AVAILABLE_SPACE" -lt 5 ]]; then
    error_exit "Insufficient disk space. At least 5GB required, ${AVAILABLE_SPACE}GB available"
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    error_exit "Docker is not running"
fi

success "Pre-deployment checks passed"

# Install dependencies
if [[ "$SKIP_BUILD" != true ]]; then
    log "Installing dependencies..."
    npm ci --production=false
    success "Dependencies installed"
fi

# Run tests
if [[ "$SKIP_TESTS" != true ]]; then
    log "Running tests..."
    
    # Unit tests
    if ! npm run test; then
        error_exit "Unit tests failed"
    fi
    success "Unit tests passed"
    
    # Integration tests
    if ! npm run test:integration; then
        warning "Integration tests failed (continuing deployment)"
    else
        success "Integration tests passed"
    fi
    
    # E2E tests (only for production)
    if [[ "$TARGET_ENV" == "production" ]]; then
        log "Running E2E tests..."
        if ! npm run test:e2e; then
            warning "E2E tests failed (continuing deployment)"
        else
            success "E2E tests passed"
        fi
    fi
fi

# Security audit
log "Running security audit..."
if ! npm audit --audit-level moderate; then
    warning "Security audit found issues (continuing deployment)"
else
    success "Security audit passed"
fi

# Build application
if [[ "$SKIP_BUILD" != true ]]; then
    log "Building application..."
    
    # Build Next.js application
    if ! npm run build; then
        error_exit "Application build failed"
    fi
    success "Application built successfully"
    
    # Build Docker image
    log "Building Docker image..."
    if ! docker build \
        --build-arg DATABASE_URL="$DATABASE_URL" \
        --build-arg NEXTAUTH_URL="$NEXTAUTH_URL" \
        --build-arg NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
        --build-arg API_SECRET_KEY="$API_SECRET_KEY" \
        -t ${APP_NAME}:${BUILD_NUMBER} \
        -t ${APP_NAME}:latest .; then
        error_exit "Docker build failed"
    fi
    success "Docker image built successfully"
fi

# Dry run check
if [[ "$DRY_RUN" == true ]]; then
    log "DRY RUN - Would deploy the following:"
    log "  - Environment: ${TARGET_ENV}"
    log "  - Build number: ${BUILD_NUMBER}"
    log "  - Image: ${APP_NAME}:${BUILD_NUMBER}"
    log "  - Services: $(docker-compose config --services | tr '\n' ' ')"
    exit 0
fi

# Database migration (if applicable)
log "Running database migrations..."
# This would typically run your migration scripts
# docker-compose run --rm app npm run migrate
warning "Database migrations skipped (implement as needed)"

# Create deployment backup
log "Creating pre-deployment backup..."
if [[ -f "./scripts/backup.sh" ]]; then
    ./scripts/backup.sh || warning "Backup failed (continuing deployment)"
else
    warning "Backup script not found"
fi

# Deploy application
log "Deploying application..."

# Update docker-compose.yml with new image tag
sed -i.bak "s|image: ${APP_NAME}:.*|image: ${APP_NAME}:${BUILD_NUMBER}|" docker-compose.yml

# Stop existing services
log "Stopping existing services..."
docker-compose down

# Start new services
log "Starting new services..."
if ! docker-compose up -d; then
    error_exit "Failed to start services"
fi

# Wait for application to be ready
log "Waiting for application to be ready..."
RETRY_COUNT=0
MAX_RETRIES=30

while [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; do
    if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
        success "Application is ready"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log "Waiting for application... (${RETRY_COUNT}/${MAX_RETRIES})"
    sleep 10
done

if [[ $RETRY_COUNT -eq $MAX_RETRIES ]]; then
    error_exit "Application failed to become ready within timeout"
fi

# Post-deployment verification
log "Running post-deployment verification..."

# Health check
HEALTH_STATUS=$(curl -s http://localhost:3000/api/health | jq -r '.status' 2>/dev/null || echo "unknown")
if [[ "$HEALTH_STATUS" != "healthy" ]]; then
    error_exit "Health check failed: $HEALTH_STATUS"
fi

# Database connectivity
if ! curl -s http://localhost:3000/api/health | jq -e '.checks.database' >/dev/null 2>&1; then
    error_exit "Database connectivity check failed"
fi

# Performance check
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000/)
if (( $(echo "$RESPONSE_TIME > 5.0" | bc -l) )); then
    warning "Response time is high: ${RESPONSE_TIME}s"
fi

success "Post-deployment verification passed"

# Clean up old Docker images (keep last 5)
log "Cleaning up old Docker images..."
docker images ${APP_NAME} --format "table {{.Repository}}\t{{.Tag}}" | grep -v TAG | tail -n +6 | awk '{print $2}' | \
while read -r tag; do
    if [[ "$tag" != "latest" ]]; then
        docker rmi ${APP_NAME}:${tag} || warning "Failed to remove image ${APP_NAME}:${tag}"
    fi
done

# Update deployment record
DEPLOYMENT_RECORD="/tmp/deployment_${BUILD_NUMBER}.json"
cat > "$DEPLOYMENT_RECORD" << EOF
{
    "deployment_id": "${BUILD_NUMBER}",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "environment": "${TARGET_ENV}",
    "application": "${APP_NAME}",
    "image_tag": "${BUILD_NUMBER}",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
    "deployed_by": "$(whoami)",
    "status": "success"
}
EOF

# Send deployment notification
if [[ -n "${DEPLOY_WEBHOOK_URL:-}" ]]; then
    log "Sending deployment notification..."
    curl -X POST "$DEPLOY_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"🚀 Deployment completed successfully\",
            \"details\": $(cat "$DEPLOYMENT_RECORD")
        }" || warning "Failed to send notification (non-critical)"
fi

success "Deployment completed successfully!"
log "Deployment ID: ${BUILD_NUMBER}"
log "Log file: ${LOG_FILE}"
log "Deployment record: ${DEPLOYMENT_RECORD}"

echo ""
echo "🎉 Deployment Summary:"
echo "   📦 Application: ${APP_NAME}"
echo "   🌍 Environment: ${TARGET_ENV}"
echo "   🏷️  Build: ${BUILD_NUMBER}"
echo "   ⏰ Duration: $(($(date +%s) - ${SECONDS:-0}))s"
echo "   🔗 Health Check: http://localhost:3000/api/health"
echo ""
echo "Next steps:"
echo "1. Monitor application logs: docker-compose logs -f"
echo "2. Check metrics: http://localhost:3000/api/metrics"
echo "3. Verify functionality in browser"