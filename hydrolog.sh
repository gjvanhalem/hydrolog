#!/bin/bash
# Docker operations script for HydroLog

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display help text
show_help() {
    echo -e "${GREEN}HydroLog Docker Operations Script${NC}"
    echo "Usage: ./hydrolog.sh [command]"
    echo
    echo "Available commands:"
    echo "  build       - Build the Docker image"
    echo "  start       - Start the HydroLog application"
    echo "  stop        - Stop the HydroLog application"
    echo "  restart     - Restart the HydroLog application"
    echo "  logs        - Show logs from the HydroLog application"
    echo "  status      - Check the status of the HydroLog application"
    echo "  prune       - Remove unused Docker resources"
    echo "  setup       - Initial setup for HydroLog (build and start)"
    echo "  help        - Show this help message"
    echo
}

# Function to check if Docker is running
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
}

# Function to build the Docker image
build_image() {
    echo -e "${YELLOW}Building HydroLog Docker image...${NC}"
    docker-compose build
}

# Function to start the application
start_app() {
    echo -e "${YELLOW}Starting HydroLog application...${NC}"
    docker-compose up -d
    echo -e "${GREEN}HydroLog is now running. Access at: http://localhost:3000${NC}"
}

# Function to stop the application
stop_app() {
    echo -e "${YELLOW}Stopping HydroLog application...${NC}"
    docker-compose down
    echo -e "${GREEN}HydroLog has been stopped.${NC}"
}

# Function to check application status
check_status() {
    echo -e "${YELLOW}Checking HydroLog status...${NC}"
    if docker-compose ps | grep -q "hydrolog"; then
        echo -e "${GREEN}HydroLog is running.${NC}"
        curl -s http://localhost:3000/api/health | grep -q "healthy" && \
            echo -e "${GREEN}Health check: PASSED${NC}" || \
            echo -e "${RED}Health check: FAILED${NC}"
    else
        echo -e "${RED}HydroLog is not running.${NC}"
    fi
}

# Main script execution
check_docker

case "$1" in
    build)
        build_image
        ;;
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        start_app
        ;;
    logs)
        echo -e "${YELLOW}Showing HydroLog logs...${NC}"
        docker-compose logs -f
        ;;
    status)
        check_status
        ;;
    prune)
        echo -e "${YELLOW}Cleaning up Docker resources...${NC}"
        docker system prune --volumes -f
        echo -e "${GREEN}Docker resources cleaned.${NC}"
        ;;
    setup)
        build_image
        start_app
        ;;
    *)
        show_help
        ;;
esac
