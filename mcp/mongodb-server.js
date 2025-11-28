#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { MongoClient, ObjectId } = require("mongodb");

// Configuración desde variables de entorno o argumentos
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB_NAME || "passquirk";

// Crear el servidor MCP
const server = new Server(
  {
    name: "passquirk-mongodb",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let client;
let db;

async function connectToDb() {
  if (!client) {
    try {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      db = client.db(DB_NAME);
      console.error(`Conectado a MongoDB: ${DB_NAME}`);
    } catch (error) {
      console.error("Error conectando a MongoDB:", error);
      throw error;
    }
  }
  return db;
}

// Definir herramientas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_collections",
        description: "Lista todas las colecciones en la base de datos",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "find_documents",
        description: "Busca documentos en una colección",
        inputSchema: {
          type: "object",
          properties: {
            collection: {
              type: "string",
              description: "Nombre de la colección",
            },
            filter: {
              type: "object",
              description: "Filtro de búsqueda (JSON)",
            },
            limit: {
              type: "number",
              description: "Límite de resultados (default: 20)",
            },
          },
          required: ["collection"],
        },
      },
      {
        name: "insert_document",
        description: "Inserta un documento en una colección",
        inputSchema: {
          type: "object",
          properties: {
            collection: {
              type: "string",
              description: "Nombre de la colección",
            },
            document: {
              type: "object",
              description: "Documento a insertar",
            },
          },
          required: ["collection", "document"],
        },
      },
      {
        name: "update_document",
        description: "Actualiza un documento en una colección",
        inputSchema: {
          type: "object",
          properties: {
            collection: {
              type: "string",
              description: "Nombre de la colección",
            },
            filter: {
              type: "object",
              description: "Filtro para encontrar el documento",
            },
            update: {
              type: "object",
              description: "Operación de actualización (ej. {$set: {...}})",
            },
          },
          required: ["collection", "filter", "update"],
        },
      },
      {
        name: "delete_document",
        description: "Elimina un documento de una colección",
        inputSchema: {
          type: "object",
          properties: {
            collection: {
              type: "string",
              description: "Nombre de la colección",
            },
            filter: {
              type: "object",
              description: "Filtro para encontrar el documento a eliminar",
            },
          },
          required: ["collection", "filter"],
        },
      },
    ],
  };
});

// Manejar ejecución de herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const database = await connectToDb();
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_collections": {
        const collections = await database.listCollections().toArray();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(collections.map((c) => c.name), null, 2),
            },
          ],
        };
      }

      case "find_documents": {
        const collection = database.collection(args.collection);
        const limit = args.limit || 20;
        const filter = args.filter || {};
        
        // Convertir _id string a ObjectId si es necesario
        if (filter._id && typeof filter._id === 'string') {
            try {
                filter._id = new ObjectId(filter._id);
            } catch (e) {
                // Ignorar si no es un ObjectId válido
            }
        }

        const documents = await collection.find(filter).limit(limit).toArray();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(documents, null, 2),
            },
          ],
        };
      }

      case "insert_document": {
        const collection = database.collection(args.collection);
        const result = await collection.insertOne(args.document);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ insertedId: result.insertedId }, null, 2),
            },
          ],
        };
      }

      case "update_document": {
        const collection = database.collection(args.collection);
        let filter = args.filter;
        
        if (filter._id && typeof filter._id === 'string') {
             try {
                filter._id = new ObjectId(filter._id);
            } catch (e) {}
        }

        const result = await collection.updateOne(filter, args.update);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  matchedCount: result.matchedCount,
                  modifiedCount: result.modifiedCount,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "delete_document": {
        const collection = database.collection(args.collection);
        let filter = args.filter;
        
         if (filter._id && typeof filter._id === 'string') {
             try {
                filter._id = new ObjectId(filter._id);
            } catch (e) {}
        }
        
        const result = await collection.deleteOne(filter);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { deletedCount: result.deletedCount },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
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
  console.error("Servidor MCP MongoDB iniciado en stdio");
}

main().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
