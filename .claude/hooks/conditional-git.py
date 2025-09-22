#!/usr/bin/env python3
import json
import sys
import subprocess
import os

def get_current_branch():
    """Get the current git branch name"""
    try:
        result = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=os.getcwd(),
            stderr=subprocess.DEVNULL
        ).decode().strip()
        return result
    except:
        return None

def is_claude_branch(branch):
    """Check if branch starts with 'claude/'"""
    return branch and branch.startswith("claude/")

def is_git_operation(tool_name, tool_input):
    """Check if this is a git operation we want to control"""
    if tool_name != "Bash":
        return False

    command = tool_input.get("command", "")
    git_operations = ["git add", "git commit", "git push"]
    return any(command.strip().startswith(op) for op in git_operations)

def main():
    try:
        # Read input from Claude Code
        input_data = json.load(sys.stdin)
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})

        # Check if this is a git operation we care about
        if not is_git_operation(tool_name, tool_input):
            # Not a git operation - let it proceed normally
            sys.exit(0)

        # Get current branch
        current_branch = get_current_branch()

        # If we can't determine branch or it's not a Claude branch, ask for permission
        if not is_claude_branch(current_branch):
            output = {
                "hookSpecificOutput": {
                    "permissionDecision": "ask",
                    "permissionDecisionReason": f"Git operations require confirmation on branch '{current_branch or 'unknown'}' (not a Claude branch)"
                }
            }
            print(json.dumps(output))
        else:
            # It's a Claude branch - auto-allow
            output = {
                "hookSpecificOutput": {
                    "permissionDecision": "allow",
                    "permissionDecisionReason": f"Auto-allowing git operation on Claude branch '{current_branch}'"
                }
            }
            print(json.dumps(output))

    except Exception as e:
        # On any error, default to asking for permission
        output = {
            "hookSpecificOutput": {
                "permissionDecision": "ask",
                "permissionDecisionReason": f"Hook error: {str(e)}"
            }
        }
        print(json.dumps(output))

if __name__ == "__main__":
    main()