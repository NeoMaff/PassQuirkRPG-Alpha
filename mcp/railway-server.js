#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { exec } = require("child_process");
const util = require("util");

const execAsync = util.promisify(exec);

// Configuración desde variables de entorno
const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;

if (!RAILWAY_TOKEN) {
  console.error("Error: RAILWAY_TOKEN environment variable is required");
  process.exit(1);
}

// Crear el servidor MCP
const server = new Server(
  {
    name: "railway-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper para ejecutar comandos de Railway CLI
async function runRailwayCommand(command) {
  try {
    // Inyectar el token en el comando o en el entorno
    const { stdout, stderr } = await execAsync(`railway ${command}`, {
      env: { ...process.env, RAILWAY_TOKEN: RAILWAY_TOKEN },
    });
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    
    return stdout.trim();
  } catch (error) {
    throw new Error(`Railway CLI Error: ${error.message}`);
  }
}

// Definir herramientas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "railway_status",
        description: "Obtiene el estado de los servicios en Railway",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "railway_logs",
        description: "Obtiene los logs recientes de un despliegue",
        inputSchema: {
          type: "object",
          properties: {
            n: {
              type: "number",
              description: "Número de líneas (default: 50)",
            },
          },
        },
      },
      {
        name: "railway_up",
        description: "Despliega el proyecto actual en Railway",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "railway_list_projects",
        description: "Lista los proyectos de Railway",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Manejar ejecución de herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result = "";

    switch (name) {
      case "railway_status":
        result = await runRailwayCommand("status");
        break;

      case "railway_logs":
        const lines = args.n || 50;
        // Intentar obtener el servicio automáticamente si falla
        try {
            result = await runRailwayCommand(`logs -n ${lines}`);
        } catch (e) {
             if (e.message.includes("No service could be found")) {
                 // Obtener el primer servicio disponible
                 const status = await runRailwayCommand("status");
                 const serviceName = "PassQuirkRPG-Alpha"; // Hardcoded temporalmente o extraer del status
                 result = await runRailwayCommand(`logs --service ${serviceName} -n ${lines}`);
             } else {
                 throw e;
             }
        }
        break;

      case "railway_up":
        result = await runRailwayCommand("up --detach"); // --detach para no bloquear
        break;

      case "railway_list_projects":
        result = await runRailwayCommand("list");
        break;

      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error ejecutando comando Railway: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Iniciar el servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Servidor MCP Railway iniciado en stdio");
}

main().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
