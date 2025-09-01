#!/bin/bash

# Parameterized Claude CLI runner with thinking levels

# Default values
PROMPT=""
PROMPT_FILE=""
ITERATIONS=1
THINKING_LEVEL="think"
DEFAULT_PROMPT_FILE="./.claude/commands/prompterate.md"

# Valid thinking levels
VALID_THINKING_LEVELS=("think" "think hard" "think harder" "think hardest" "ultrathink")

# Function to show usage
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Run Claude CLI in a loop with specified prompts and thinking levels."
    echo ""
    echo "Options:"
    echo "  --prompt TEXT           Plain text prompt instructions"
    echo "  --prompt-file PATH      Path to prompt file"
    echo "  --iterations N          Number of loops (default: 1)"
    echo "  --thinking-level LEVEL  Thinking level: think, think hard, think harder, think hardest, ultrathink (default: think)"
    echo "  --help                  Show this help message"
    echo ""
    echo "Notes:"
    echo "  - --prompt and --prompt-file are mutually exclusive"
    echo "  - If neither --prompt nor --prompt-file is provided, defaults to: $DEFAULT_PROMPT_FILE"
    echo "  - Script waits 60 seconds between iterations"
    echo ""
    echo "Examples:"
    echo "  $0 --prompt \"Debug this code\" --thinking-level \"think hard\" --iterations 3"
    echo "  $0 --prompt-file ./my-prompt.md --iterations 5"
    echo "  $0 --thinking-level \"ultrathink\""
}

# Function to validate thinking level
validate_thinking_level() {
    local level="$1"
    for valid_level in "${VALID_THINKING_LEVELS[@]}"; do
        if [[ "$level" == "$valid_level" ]]; then
            return 0
        fi
    done
    echo "Error: Invalid thinking level '$level'"
    echo "Valid levels: ${VALID_THINKING_LEVELS[*]}"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --prompt)
            PROMPT="$2"
            shift 2
            ;;
        --prompt-file)
            PROMPT_FILE="$2"
            shift 2
            ;;
        --iterations)
            ITERATIONS="$2"
            shift 2
            ;;
        --thinking-level)
            THINKING_LEVEL="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Error: Unknown option $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate arguments
if [[ -n "$PROMPT" && -n "$PROMPT_FILE" ]]; then
    echo "Error: --prompt and --prompt-file cannot be used together"
    exit 1
fi

# Validate iterations is a number
if ! [[ "$ITERATIONS" =~ ^[0-9]+$ ]] || [[ "$ITERATIONS" -lt 1 ]]; then
    echo "Error: --iterations must be a positive number"
    exit 1
fi

# Validate thinking level
validate_thinking_level "$THINKING_LEVEL"

# Set default prompt file if neither prompt nor prompt-file provided
if [[ -z "$PROMPT" && -z "$PROMPT_FILE" ]]; then
    PROMPT_FILE="$DEFAULT_PROMPT_FILE"
fi

# Prepare the final prompt
if [[ -n "$PROMPT" ]]; then
    FINAL_PROMPT="$PROMPT $THINKING_LEVEL"
    echo "Using text prompt with thinking level: $THINKING_LEVEL"
else
    if [[ ! -f "$PROMPT_FILE" ]]; then
        echo "Error: Prompt file '$PROMPT_FILE' not found"
        exit 1
    fi
    PROMPT_CONTENT=$(cat "$PROMPT_FILE")
    FINAL_PROMPT="$PROMPT_CONTENT $THINKING_LEVEL"
    echo "Using prompt file: $PROMPT_FILE"
    echo "Thinking level: $THINKING_LEVEL"
fi

echo "Iterations: $ITERATIONS"
echo ""

# Main execution loop
for i in $(seq 1 $ITERATIONS); do
    echo "=== Run #$i of $ITERATIONS Starting ==="
    
    claude -p --dangerously-skip-permissions "$FINAL_PROMPT"
    
    echo "=== Run #$i of $ITERATIONS Finished ==="
    
    if [ $i -lt $ITERATIONS ]; then
        echo "Waiting 60 seconds..."
        sleep 60
    fi
done

echo "Done!"