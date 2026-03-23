#!/usr/bin/env npx tsx

/**
 * UI Architect MCP Client
 *
 * Connects to the UI Architect MCP Server via stdio transport,
 * then lists all available tools, prompts, and resources.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  // Spawn the MCP server as a child process and connect via stdio
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
  });

  const client = new Client({
    name: 'ui-architect-client',
    version: '1.0.0',
  });

  console.log('Connecting to UI Architect MCP Server...\n');
  await client.connect(transport);
  console.log('Connected!\n');

  // ─── List Tools ───────────────────────────────────────────────────────────────

  console.log('═══════════════════════════════════════════');
  console.log('  TOOLS');
  console.log('═══════════════════════════════════════════\n');

  const { tools } = await client.listTools();

  if (tools.length === 0) {
    console.log('  (no tools registered)\n');
  } else {
    for (const tool of tools) {
      console.log(`  🔧 ${tool.name}`);
      if (tool.description) {
        // Show first line of description only
        const firstLine = tool.description.split('\n')[0].trim();
        console.log(`     ${firstLine}`);
      }
      if (tool.inputSchema) {
        const props = (tool.inputSchema as any).properties;
        if (props) {
          const params = Object.keys(props);
          console.log(`     Params: ${params.join(', ')}`);
        }
      }
      console.log();
    }
    console.log(`  Total: ${tools.length} tool(s)\n`);
  }

  // ─── List Prompts ─────────────────────────────────────────────────────────────

  console.log('═══════════════════════════════════════════');
  console.log('  PROMPTS');
  console.log('═══════════════════════════════════════════\n');

  try {
    const { prompts } = await client.listPrompts();

    if (prompts.length === 0) {
      console.log('  (no prompts registered)\n');
    } else {
      for (const prompt of prompts) {
        console.log(`  📝 ${prompt.name}`);
        if (prompt.description) {
          console.log(`     ${prompt.description}`);
        }
        if (prompt.arguments && prompt.arguments.length > 0) {
          const argNames = prompt.arguments.map(
            (a) => `${a.name}${a.required ? '' : '?'}`
          );
          console.log(`     Args: ${argNames.join(', ')}`);
        }
        console.log();
      }
      console.log(`  Total: ${prompts.length} prompt(s)\n`);
    }
  } catch (err) {
    console.log('  (server does not support prompts)\n');
  }

  // ─── List Resources ───────────────────────────────────────────────────────────

  console.log('═══════════════════════════════════════════');
  console.log('  RESOURCES');
  console.log('═══════════════════════════════════════════\n');

  try {
    const { resources } = await client.listResources();

    if (resources.length === 0) {
      console.log('  (no resources registered)\n');
    } else {
      for (const resource of resources) {
        console.log(`  📦 ${resource.name}`);
        if (resource.uri) {
          console.log(`     URI: ${resource.uri}`);
        }
        if (resource.description) {
          console.log(`     ${resource.description}`);
        }
        if (resource.mimeType) {
          console.log(`     Type: ${resource.mimeType}`);
        }
        console.log();
      }
      console.log(`  Total: ${resources.length} resource(s)\n`);
    }
  } catch (err) {
    console.log('  (server does not support resources)\n');
  }

  // ─── Done ─────────────────────────────────────────────────────────────────────

  console.log('═══════════════════════════════════════════');
  console.log('  Done. Disconnecting...');
  console.log('═══════════════════════════════════════════\n');

  await client.close();
}

main().catch((error) => {
  console.error('Client error:', error);
  process.exit(1);
});
