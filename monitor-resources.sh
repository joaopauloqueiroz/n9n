#!/bin/bash

# Resource Monitoring Script for N9N
# This script monitors Docker containers and alerts on high resource usage

set -e

BACKEND_CONTAINER="n9n-backend"
FRONTEND_CONTAINER="n9n-frontend"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Thresholds
CPU_THRESHOLD=80
MEM_THRESHOLD=80

echo "=========================================="
echo "N9N Resource Monitor"
echo "=========================================="
echo ""

# Function to check if container is running
check_container() {
    local container=$1
    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "${RED}❌ Container ${container} is not running${NC}"
        return 1
    fi
    return 0
}

# Function to get container stats
get_stats() {
    local container=$1
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep "$container"
}

# Function to check for zombie Chromium processes
check_chromium() {
    echo "Checking for zombie Chromium processes..."
    local chromium_count=$(docker exec $BACKEND_CONTAINER sh -c "ps aux | grep chromium | grep -v grep | wc -l" 2>/dev/null || echo "0")
    
    if [ "$chromium_count" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found $chromium_count Chromium process(es) running${NC}"
        docker exec $BACKEND_CONTAINER sh -c "ps aux | grep chromium | grep -v grep"
    else
        echo -e "${GREEN}✅ No zombie Chromium processes${NC}"
    fi
    echo ""
}

# Function to check execution count
check_executions() {
    echo "Checking active executions..."
    local exec_count=$(docker exec $BACKEND_CONTAINER sh -c "ps aux | grep 'node.*execution' | grep -v grep | wc -l" 2>/dev/null || echo "0")
    echo "Active execution processes: $exec_count"
    echo ""
}

# Function to parse and alert on high usage
check_usage() {
    local container=$1
    local stats=$(docker stats --no-stream --format "{{.CPUPerc}},{{.MemPerc}}" "$container" 2>/dev/null)
    
    if [ -z "$stats" ]; then
        echo -e "${RED}❌ Could not get stats for $container${NC}"
        return
    fi
    
    local cpu=$(echo "$stats" | cut -d',' -f1 | sed 's/%//')
    local mem=$(echo "$stats" | cut -d',' -f2 | sed 's/%//')
    
    # Remove decimal part for comparison
    cpu=${cpu%.*}
    mem=${mem%.*}
    
    echo "Container: $container"
    echo "  CPU: ${cpu}%"
    echo "  Memory: ${mem}%"
    
    if [ "$cpu" -gt "$CPU_THRESHOLD" ]; then
        echo -e "  ${RED}⚠️  HIGH CPU USAGE!${NC}"
    fi
    
    if [ "$mem" -gt "$MEM_THRESHOLD" ]; then
        echo -e "  ${RED}⚠️  HIGH MEMORY USAGE!${NC}"
    fi
    
    echo ""
}

# Main monitoring loop
main() {
    # Check if containers are running
    if ! check_container "$BACKEND_CONTAINER"; then
        exit 1
    fi
    
    if ! check_container "$FRONTEND_CONTAINER"; then
        exit 1
    fi
    
    echo "📊 Current Resource Usage:"
    echo "=========================================="
    get_stats "$BACKEND_CONTAINER"
    get_stats "$FRONTEND_CONTAINER"
    echo ""
    
    echo "🔍 Detailed Analysis:"
    echo "=========================================="
    check_usage "$BACKEND_CONTAINER"
    check_usage "$FRONTEND_CONTAINER"
    
    check_chromium
    check_executions
    
    # Check Docker logs for errors (last 50 lines)
    echo "📋 Recent Errors in Logs:"
    echo "=========================================="
    local errors=$(docker logs --tail 50 "$BACKEND_CONTAINER" 2>&1 | grep -i "error\|exception\|failed" | tail -5)
    if [ -n "$errors" ]; then
        echo -e "${YELLOW}$errors${NC}"
    else
        echo -e "${GREEN}✅ No recent errors${NC}"
    fi
    echo ""
    
    # System resources
    echo "🖥️  VPS Resources:"
    echo "=========================================="
    echo "Memory:"
    free -h | grep -E "Mem|Swap"
    echo ""
    echo "Disk:"
    df -h / | tail -1
    echo ""
    
    echo "✅ Monitoring complete"
}

# Run monitoring
main

# Optional: Continuous monitoring mode
if [ "$1" == "--watch" ]; then
    echo ""
    echo "Entering watch mode (updates every 10 seconds)..."
    echo "Press Ctrl+C to stop"
    echo ""
    
    while true; do
        clear
        main
        sleep 10
    done
fi
