# Complete Pinecone Workflow in Gemini CLI

## Objective

Learn how to set up and use the Pinecone MCP server with Gemini CLI for semantic search, knowledge management, and AI-powered document retrieval from the command line.

## Prerequisites

- [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed
- [Node.js](https://nodejs.org) v18 or later installed
- Pinecone account with API key from [app.pinecone.io](https://app.pinecone.io)
- Google AI API key from [ai.google.dev](https://ai.google.dev)

## Overview

This guide covers:
1. Installing and configuring the Pinecone MCP server with Gemini CLI
2. Using Pinecone through terminal commands and conversations
3. Building automated workflows with scripts
4. Advanced patterns for CLI-based knowledge management

## Step-by-Step Workflow

### Step 1: Install Gemini CLI

#### 1.1 Verify Prerequisites

Check that Node.js is installed:

```bash
node --version
# Should show v18.0.0 or later

npm --version
```

#### 1.2 Install Gemini CLI

```bash
npm install -g @google/generative-ai-cli
```

Verify installation:

```bash
gemini --version
```

#### 1.3 Get Your Google AI API Key

1. Visit [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key"
3. Create a new project or select existing
4. Copy your API key

#### 1.4 Configure Gemini CLI

Set your Google AI API key:

```bash
export GOOGLE_AI_API_KEY="your-google-api-key"
```

To make this permanent, add to your shell profile:

**Bash (~/.bashrc or ~/.bash_profile):**
```bash
echo 'export GOOGLE_AI_API_KEY="your-google-api-key"' >> ~/.bashrc
source ~/.bashrc
```

**Zsh (~/.zshrc):**
```bash
echo 'export GOOGLE_AI_API_KEY="your-google-api-key"' >> ~/.zshrc
source ~/.zshrc
```

**Windows (Command Prompt):**
```cmd
setx GOOGLE_AI_API_KEY "your-google-api-key"
```

Test Gemini CLI:

```bash
gemini "Hello, can you hear me?"
```

### Step 2: Install Pinecone MCP Extension

#### 2.1 Get Your Pinecone API Key

1. Visit [app.pinecone.io](https://app.pinecone.io)
2. Sign in or create a free account
3. Go to "API Keys" section
4. Create or copy an API key

#### 2.2 Install Pinecone MCP Extension

```bash
gemini extensions install https://github.com/pinecone-io/pinecone-mcp
```

You should see:

```
Installing extension from https://github.com/pinecone-io/pinecone-mcp
Extension 'pinecone' installed successfully
```

#### 2.3 Configure Pinecone API Key

Set your Pinecone API key as an environment variable:

```bash
export PINECONE_API_KEY="your-pinecone-api-key"
```

Make it permanent:

**Bash/Zsh:**
```bash
echo 'export PINECONE_API_KEY="your-pinecone-api-key"' >> ~/.bashrc
source ~/.bashrc
```

**Windows:**
```cmd
setx PINECONE_API_KEY "your-pinecone-api-key"
```

#### 2.4 Verify MCP Extension

Run Gemini and check available MCP servers:

```bash
gemini
```

In the Gemini CLI interface, press `Ctrl+T` to see available MCP tools. You should see "pinecone" in the list.

Type `exit` to leave the Gemini CLI.

### Step 3: Create Your First Index

#### 3.1 Start Interactive Session

```bash
gemini
```

#### 3.2 Create an Index

Type this prompt:

```
Create a new Pinecone index called 'cli-knowledge-base' using the multilingual-e5-large model
```

Gemini will use the Pinecone MCP tool to create the index.

#### 3.3 Verify Index Creation

```
List all my Pinecone indexes and describe their configurations
```

You should see `cli-knowledge-base` in the list.

### Step 4: Add Data to Your Index

#### 4.1 Direct Prompting

Still in the Gemini interactive session:

```
Upsert the following CLI tips to my 'cli-knowledge-base' index:

1. "Use 'grep -r pattern directory' to recursively search for patterns in files."
2. "The 'find' command locates files by name, type, size, or modification time."
3. "Use 'awk' for text processing and data extraction from structured text files."
4. "The pipe operator '|' connects commands, sending output from one as input to another."
5. "Use 'xargs' to build and execute commands from standard input."
```

#### 4.2 Alternative: One-Line Command

Exit the interactive session (`exit`) and use one-line commands:

```bash
gemini "Upsert this document to my cli-knowledge-base index: 'The tar command creates and extracts archive files. Common options: -c create, -x extract, -z compress with gzip, -v verbose output.'"
```

### Step 5: Search Your Index

#### 5.1 Interactive Search

Start Gemini:

```bash
gemini
```

Search your index:

```
Search my 'cli-knowledge-base' index for information about searching files
```

#### 5.2 One-Line Search

```bash
gemini "Search my cli-knowledge-base index for text processing tools"
```

#### 5.3 Search with Filtering

If you added metadata:

```bash
gemini "Search my cli-knowledge-base index for 'file operations' where category equals 'beginner'"
```

### Step 6: Advanced CLI Workflows

#### 6.1 Bulk Upload from File

Create a script to upload multiple documents:

**upload-docs.sh:**
```bash
#!/bin/bash

# Read documents from file and upsert to Pinecone
INDEX_NAME="cli-knowledge-base"

while IFS= read -r line; do
    gemini "Upsert this to my $INDEX_NAME index: $line"
    sleep 1  # Rate limiting
done < documents.txt
```

**documents.txt:**
```
The ls command lists directory contents. Use -la for detailed view including hidden files.
The cd command changes the current directory. Use 'cd -' to return to previous directory.
The cat command displays file contents. Use 'cat file1 file2 > combined' to concatenate files.
```

Run the script:

```bash
chmod +x upload-docs.sh
./upload-docs.sh
```

#### 6.2 Automated Search Script

**search-kb.sh:**
```bash
#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./search-kb.sh 'your search query'"
    exit 1
fi

QUERY="$1"
INDEX_NAME="cli-knowledge-base"

gemini "Search my $INDEX_NAME index for: $QUERY"
```

Usage:

```bash
chmod +x search-kb.sh
./search-kb.sh "file permissions"
```

#### 6.3 Interactive Knowledge Base Manager

**kb-manager.sh:**
```bash
#!/bin/bash

INDEX_NAME="cli-knowledge-base"

echo "Knowledge Base Manager"
echo "====================="
echo "1. Add document"
echo "2. Search"
echo "3. View index stats"
echo "4. Exit"
echo

read -p "Select option: " option

case $option in
    1)
        read -p "Enter document text: " doc
        gemini "Upsert to my $INDEX_NAME index: $doc"
        ;;
    2)
        read -p "Enter search query: " query
        gemini "Search my $INDEX_NAME index for: $query"
        ;;
    3)
        gemini "Describe the stats for my $INDEX_NAME index"
        ;;
    4)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid option"
        ;;
esac
```

Usage:

```bash
chmod +x kb-manager.sh
./kb-manager.sh
```

### Step 7: Integration with Other CLI Tools

#### 7.1 Index Man Pages

Create a script to index system man pages:

**index-man-pages.sh:**
```bash
#!/bin/bash

INDEX_NAME="man-pages"

# Create index
gemini "Create a Pinecone index called '$INDEX_NAME' using multilingual-e5-large"

# Index common commands
for cmd in ls cd cat grep find awk sed tar git; do
    description=$(man $cmd 2>/dev/null | head -n 20 | tr '\n' ' ')
    gemini "Upsert to my $INDEX_NAME index with metadata: command='$cmd', text='$description'"
    sleep 1
done

echo "Indexed man pages for common commands"
```

Search man pages:

```bash
gemini "Search my man-pages index for commands that work with files"
```

#### 7.2 Index Git Commit Messages

**index-git-commits.sh:**
```bash
#!/bin/bash

INDEX_NAME="git-commits"

# Create index
gemini "Create a Pinecone index called '$INDEX_NAME' using multilingual-e5-large"

# Get recent commits
git log --format="%h|%an|%s|%ai" -n 100 | while IFS='|' read -r hash author message date; do
    gemini "Upsert to my $INDEX_NAME index: hash='$hash', author='$author', message='$message', date='$date'"
    sleep 0.5
done

echo "Indexed 100 recent git commits"
```

Search commits:

```bash
gemini "Search my git-commits index for commits related to authentication"
```

#### 7.3 Index Code Files

**index-codebase.sh:**
```bash
#!/bin/bash

INDEX_NAME="codebase"

# Create index
gemini "Create a Pinecone index called '$INDEX_NAME' using multilingual-e5-large"

# Find and index Python files
find . -name "*.py" -type f | while read -r file; do
    # Get file content (first 1000 characters)
    content=$(head -c 1000 "$file")
    gemini "Upsert to my $INDEX_NAME index: filepath='$file', language='python', content='$content'"
    sleep 1
done

echo "Indexed Python files"
```

Search code:

```bash
gemini "Search my codebase index for authentication functions"
```

## Real-World CLI Use Cases

### Use Case 1: Command Reference System

Build a searchable command reference:

```bash
# Create index
gemini "Create index called 'command-ref' using multilingual-e5-large"

# Add commands
gemini "Upsert to command-ref: 'ffmpeg -i input.mp4 output.gif converts video to animated GIF'"
gemini "Upsert to command-ref: 'rsync -avz source/ dest/ syncs directories efficiently'"
gemini "Upsert to command-ref: 'curl -X POST -H Content-Type:application/json -d {data} url sends JSON POST request'"

# Search when needed
gemini "Search command-ref for how to convert video formats"
```

### Use Case 2: Project Documentation Search

Index all project markdown files:

```bash
#!/bin/bash
INDEX_NAME="project-docs"

gemini "Create index called '$INDEX_NAME' using multilingual-e5-large"

find . -name "*.md" -type f | while read -r file; do
    content=$(cat "$file")
    filename=$(basename "$file")
    gemini "Upsert to my $INDEX_NAME index: filename='$filename', path='$file', content='$content'"
    sleep 1
done
```

### Use Case 3: Log Analysis

Index and search log files:

```bash
# Index recent errors
grep "ERROR" /var/log/app.log | tail -n 100 | while read -r line; do
    gemini "Upsert to my error-logs index: $line"
done

# Search for specific errors
gemini "Search my error-logs index for database connection failures"
```

### Use Case 4: Personal Notes System

Create a searchable notes system:

**add-note.sh:**
```bash
#!/bin/bash
INDEX_NAME="personal-notes"

if [ -z "$1" ]; then
    echo "Usage: ./add-note.sh 'your note text' [category] [tags]"
    exit 1
fi

NOTE="$1"
CATEGORY="${2:-general}"
TAGS="${3:-none}"

gemini "Upsert to my $INDEX_NAME index: text='$NOTE', category='$CATEGORY', tags='$TAGS', date='$(date -I)'"
```

**search-notes.sh:**
```bash
#!/bin/bash
INDEX_NAME="personal-notes"

if [ -z "$1" ]; then
    echo "Usage: ./search-notes.sh 'search query'"
    exit 1
fi

gemini "Search my $INDEX_NAME index for: $1"
```

## Keyboard Shortcuts in Gemini CLI

- `Ctrl+C`: Cancel current operation
- `Ctrl+D`: Exit Gemini CLI
- `Ctrl+T`: Show available MCP tools
- `Up Arrow`: Previous command history
- `Down Arrow`: Next command history

## Common Issues and Solutions

### Issue: Pinecone Extension Not Found

**Symptoms:**
- `Ctrl+T` doesn't show Pinecone
- Gemini doesn't recognize Pinecone commands

**Solutions:**
```bash
# Verify extension is installed
gemini extensions list

# If not listed, install again
gemini extensions install https://github.com/pinecone-io/pinecone-mcp

# Verify environment variable is set
echo $PINECONE_API_KEY
```

### Issue: Authentication Errors

**Symptoms:**
- "Invalid API key" errors
- "Authentication failed" messages

**Solutions:**
```bash
# Check API key is set
echo $PINECONE_API_KEY

# If not set, export it
export PINECONE_API_KEY="your-api-key"

# Verify key in Pinecone console
# Visit https://app.pinecone.io
```

### Issue: Rate Limiting

**Symptoms:**
- "Too many requests" errors
- Commands timing out

**Solutions:**
```bash
# Add delays between operations in scripts
sleep 1  # Wait 1 second

# Reduce batch sizes
# Process smaller chunks of data

# Check rate limits in Pinecone console
```

### Issue: Command Not Found

**Symptoms:**
- `gemini: command not found`

**Solutions:**
```bash
# Verify installation
npm list -g @google/generative-ai-cli

# Reinstall if needed
npm install -g @google/generative-ai-cli

# Check PATH includes npm global bin
echo $PATH
npm config get prefix
```

### Issue: Environment Variables Not Persisting

**Symptoms:**
- API keys work in current session but not after restart

**Solutions:**
```bash
# Add to shell profile
echo 'export PINECONE_API_KEY="your-key"' >> ~/.bashrc
echo 'export GOOGLE_AI_API_KEY="your-key"' >> ~/.bashrc

# Reload shell
source ~/.bashrc

# Verify
echo $PINECONE_API_KEY
echo $GOOGLE_AI_API_KEY
```

## Best Practices for CLI Usage

### 1. Create Reusable Scripts

Store common operations in shell scripts:

```bash
# create-index.sh
gemini "Create index called '$1' using multilingual-e5-large"

# Usage
./create-index.sh my-new-index
```

### 2. Use Aliases for Frequent Commands

Add to `.bashrc` or `.zshrc`:

```bash
alias kb-search='gemini "Search my knowledge-base index for:"'
alias kb-add='gemini "Upsert to my knowledge-base index:"'
alias kb-stats='gemini "Describe stats for my knowledge-base index"'

# Usage
kb-search "semantic search"
kb-add "New knowledge base entry"
kb-stats
```

### 3. Implement Error Handling

```bash
#!/bin/bash

if ! command -v gemini &> /dev/null; then
    echo "Error: Gemini CLI not installed"
    exit 1
fi

if [ -z "$PINECONE_API_KEY" ]; then
    echo "Error: PINECONE_API_KEY not set"
    exit 1
fi

# Your commands here
```

### 4. Log Operations

```bash
#!/bin/bash

LOG_FILE="$HOME/pinecone-operations.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Starting upsert operation"
gemini "Upsert to my index: $DATA"
log "Upsert completed"
```

### 5. Use Configuration Files

**config.sh:**
```bash
#!/bin/bash

export INDEX_NAME="my-knowledge-base"
export RERANK_MODEL="bge-reranker-v2-m3"
export TOP_K_RESULTS=10
```

**scripts/search.sh:**
```bash
#!/bin/bash

source config.sh

gemini "Search my $INDEX_NAME index for: $1, show top $TOP_K_RESULTS results with reranking"
```

## Automation Examples

### Scheduled Index Updates with Cron

Add to crontab (`crontab -e`):

```cron
# Update knowledge base every day at 2 AM
0 2 * * * /path/to/update-kb.sh >> /var/log/kb-update.log 2>&1

# Index new log entries every hour
0 * * * * /path/to/index-logs.sh >> /var/log/index-logs.log 2>&1
```

### CI/CD Integration

**In GitHub Actions (.github/workflows/index-docs.yml):**
```yaml
name: Index Documentation

on:
  push:
    paths:
      - 'docs/**'

jobs:
  index:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Gemini CLI
        run: npm install -g @google/generative-ai-cli
      
      - name: Install Pinecone MCP
        run: gemini extensions install https://github.com/pinecone-io/pinecone-mcp
        env:
          GOOGLE_AI_API_KEY: ${{ secrets.GOOGLE_AI_API_KEY }}
      
      - name: Index Documentation
        run: ./scripts/index-docs.sh
        env:
          PINECONE_API_KEY: ${{ secrets.PINECONE_API_KEY }}
          GOOGLE_AI_API_KEY: ${{ secrets.GOOGLE_AI_API_KEY }}
```

## Tips and Tricks

### 1. Pipe Commands for Complex Workflows

```bash
# Index files matching a pattern
find . -name "*.txt" | xargs -I {} gemini "Upsert to my docs index: $(cat {})"

# Search and save results
gemini "Search my index for important topics" > results.txt
```

### 2. Use Heredocs for Multi-Line Content

```bash
gemini << EOF
Upsert to my knowledge-base index:

Title: Complex Configuration
Content: $(cat config-docs.md)
Category: technical
Tags: configuration, advanced
EOF
```

### 3. Create Interactive Menus

```bash
#!/bin/bash

while true; do
    echo "1. Search"
    echo "2. Add"
    echo "3. Stats"
    echo "4. Exit"
    read -p "Choose: " choice
    
    case $choice in
        1) read -p "Query: " q; gemini "Search my index for: $q";;
        2) read -p "Text: " t; gemini "Upsert to my index: $t";;
        3) gemini "Describe my index stats";;
        4) exit 0;;
    esac
done
```

## Next Steps

- [Cursor Workflow](./cursor-workflow.md) - Use Pinecone with Cursor IDE
- [Claude Desktop Workflow](./claude-desktop-workflow.md) - Use Pinecone with Claude Desktop
- [Advanced Patterns](../advanced/) - Explore cascading search, analytics, and error handling

## Related Resources

- [Gemini CLI Documentation](https://github.com/google-gemini/gemini-cli)
- [MCP Specification](https://modelcontextprotocol.io)
- [Pinecone MCP Server Docs](https://docs.pinecone.io/guides/operations/mcp-server)
- [Bash Scripting Guide](https://www.gnu.org/software/bash/manual/)
