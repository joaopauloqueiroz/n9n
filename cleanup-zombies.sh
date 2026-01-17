#!/bin/bash

# Cleanup Script for N9N
# Kills zombie Chromium processes and cleans up old data

set -e

BACKEND_CONTAINER="n9n-backend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "N9N Cleanup Script"
echo "=========================================="
echo ""

# Function to kill zombie Chromium processes
kill_chromium() {
    echo "Checking for zombie Chromium processes..."
    
    local chromium_pids=$(docker exec $BACKEND_CONTAINER sh -c "ps aux | grep chromium | grep -v grep | awk '{print \$2}'" 2>/dev/null || echo "")
    
    if [ -z "$chromium_pids" ]; then
        echo -e "${GREEN}✅ No zombie Chromium processes found${NC}"
        return
    fi
    
    echo -e "${YELLOW}Found zombie Chromium processes. Killing...${NC}"
    
    for pid in $chromium_pids; do
        echo "Killing process $pid..."
        docker exec $BACKEND_CONTAINER sh -c "kill -9 $pid" 2>/dev/null || true
    done
    
    echo -e "${GREEN}✅ Zombie processes killed${NC}"
    echo ""
}

# Function to clean up old execution logs (older than 7 days)
cleanup_old_logs() {
    echo "Cleaning up old execution logs (older than 7 days)..."
    
    docker exec $BACKEND_CONTAINER sh -c "cd /app/apps/backend && npx prisma db execute --stdin" << 'EOF'
DELETE FROM "ExecutionLog" WHERE "createdAt" < NOW() - INTERVAL '7 days';
EOF
    
    echo -e "${GREEN}✅ Old execution logs cleaned${NC}"
    echo ""
}

# Function to clean up completed executions (older than 7 days)
cleanup_old_executions() {
    echo "Cleaning up old completed executions (older than 7 days)..."
    
    docker exec $BACKEND_CONTAINER sh -c "cd /app/apps/backend && npx prisma db execute --stdin" << 'EOF'
DELETE FROM "WorkflowExecution" 
WHERE "completedAt" IS NOT NULL 
AND "completedAt" < NOW() - INTERVAL '7 days';
EOF
    
    echo -e "${GREEN}✅ Old executions cleaned${NC}"
    echo ""
}

# Function to restart backend if needed
restart_backend() {
    echo "Do you want to restart the backend container? (y/n)"
    read -r response
    
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        echo "Restarting backend container..."
        docker restart $BACKEND_CONTAINER
        echo -e "${GREEN}✅ Backend restarted${NC}"
    else
        echo "Skipping restart"
    fi
    echo ""
}

# Main cleanup
main() {
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER}$"; then
        echo -e "${RED}❌ Container ${BACKEND_CONTAINER} is not running${NC}"
        exit 1
    fi
    
    kill_chromium
    
    # Ask before cleaning database
    echo "Do you want to clean up old database records? (y/n)"
    read -r response
    
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        cleanup_old_logs
        cleanup_old_executions
    else
        echo "Skipping database cleanup"
        echo ""
    fi
    
    restart_backend
    
    echo "=========================================="
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
    echo "=========================================="
}

# Run cleanup
main
