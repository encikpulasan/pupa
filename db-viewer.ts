import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { getKv, KV_COLLECTIONS } from "./db/kv.ts";

const router = new Router();

// HTML template for the database viewer
const dbViewerUi = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>KV Database Viewer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        .json-viewer {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
            white-space: pre-wrap;
            word-break: break-all;
            font-size: 0.9rem;
            line-height: 1.5;
        }
        .collection-item {
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid #e5e7eb;
        }
        .collection-item:hover {
            border-color: #6366f1;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        .collection-item.active {
            border-color: #6366f1;
            background-color: #f3f4f6;
        }
        .key-item {
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid #e5e7eb;
        }
        .key-item:hover {
            border-color: #6366f1;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        .key-item.active {
            border-color: #6366f1;
            background-color: #f3f4f6;
        }
        .card {
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            height: calc(100vh - 8rem);
            display: flex;
            flex-direction: column;
        }
        .card-header {
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            background-color: #f8fafc;
            border-radius: 0.75rem 0.75rem 0 0;
        }
        .card-content {
            flex-grow: 1;
            overflow-y: auto;
            padding: 1rem;
        }
        .card-content::-webkit-scrollbar {
            width: 8px;
        }
        .card-content::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }
        .card-content::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
        }
        .card-content::-webkit-scrollbar-thumb:hover {
            background: #a1a1a1;
        }
        .badge {
            font-size: 0.75rem;
            padding: 0.125rem 0.5rem;
            border-radius: 9999px;
            font-weight: 500;
        }
        .badge-blue {
            background-color: #e0e7ff;
            color: #4f46e5;
        }
        .badge-gray {
            background-color: #f3f4f6;
            color: #4b5563;
        }
        .grid-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
            height: calc(100vh - 8rem);
        }
        .grid-item {
            height: 100%;
        }
        .json-key {
            color: #7c3aed;
            font-weight: 500;
        }
        .json-string {
            color: #059669;
        }
        .json-boolean {
            color: #2563eb;
        }
        .json-number {
            color: #dc2626;
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-semibold text-gray-900">KV Database Viewer</h1>
            <div class="text-sm text-gray-500">Deno KV Explorer</div>
        </div>
        
        <div class="grid-container">
            <!-- Collections Panel -->
            <div class="grid-item">
                <div class="card">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <h2 class="text-lg font-medium text-gray-900">Collections</h2>
                            <span id="collections-count" class="badge badge-blue">0</span>
                        </div>
                    </div>
                    <div id="collections-list" class="card-content">
                        <!-- Collections will be populated here -->
                    </div>
                </div>
            </div>

            <!-- Keys Panel -->
            <div class="grid-item">
                <div class="card">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <h2 class="text-lg font-medium text-gray-900">Keys</h2>
                            <span id="keys-count" class="badge badge-gray">0</span>
                        </div>
                    </div>
                    <div id="keys-list" class="card-content">
                        <!-- Keys will be populated here -->
                    </div>
                </div>
            </div>

            <!-- Value Panel -->
            <div class="grid-item">
                <div class="card">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <h2 class="text-lg font-medium text-gray-900">Value</h2>
                            <div id="value-info" class="text-sm text-gray-500"></div>
                        </div>
                    </div>
                    <div class="card-content">
                        <div id="value-display" class="json-viewer bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <!-- Value will be displayed here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentCollection = null;
        let currentKey = null;

        function updateActiveStates() {
            // Update collection items
            document.querySelectorAll('.collection-item').forEach(item => {
                item.classList.toggle('active', item.dataset.collection === currentCollection);
            });

            // Update key items
            document.querySelectorAll('.key-item').forEach(item => {
                item.classList.toggle('active', item.dataset.key === currentKey);
            });
        }

        // Function to fetch and display collections
        async function loadCollections() {
            try {
                const response = await fetch('/api/db/collections');
                const collections = await response.json();
                const collectionsList = document.getElementById('collections-list');
                
                // Update collections count
                document.getElementById('collections-count').textContent = collections.length;

                collectionsList.innerHTML = collections.map(collection => 
                    \`<div class="collection-item p-4 mb-3 rounded-lg bg-white" 
                         data-collection="\${collection}"
                         onclick="loadKeys('\${collection}')">
                        <div class="font-medium text-gray-700">\${collection}</div>
                    </div>\`
                ).join('');
                
                updateActiveStates();
            } catch (error) {
                console.error('Error loading collections:', error);
            }
        }

        // Function to fetch and display keys for a collection
        async function loadKeys(collection) {
            currentCollection = collection;
            try {
                const response = await fetch(\`/api/db/collections/\${collection}/keys\`);
                const keys = await response.json();
                const keysList = document.getElementById('keys-list');
                
                // Update keys count
                document.getElementById('keys-count').textContent = keys.length;
                
                keysList.innerHTML = keys.map(key => 
                    \`<div class="key-item p-4 mb-3 rounded-lg bg-white" 
                         data-key="\${key}"
                         onclick="loadValue('\${collection}', '\${key}')">
                        <div class="font-medium text-gray-700">\${key}</div>
                    </div>\`
                ).join('');
                
                document.getElementById('value-display').innerHTML = 
                    '<div class="text-gray-500 text-center py-4">Select a key to view its value</div>';
                document.getElementById('value-info').textContent = '';
                
                updateActiveStates();
            } catch (error) {
                console.error('Error loading keys:', error);
            }
        }

        // Function to fetch and display value for a key
        async function loadValue(collection, key) {
            currentKey = key;
            try {
                const response = await fetch(\`/api/db/collections/\${collection}/keys/\${key}\`);
                const value = await response.json();
                
                // Update value info
                document.getElementById('value-info').textContent = \`\${collection} → \${key}\`;
                
                // Format and syntax highlight the JSON
                const formattedValue = JSON.stringify(value, null, 2)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"([^"]+)":/g, '<span class="json-key">"\$1"</span>:')
                    .replace(/"([^"]+)"/g, '<span class="json-string">"\$1"</span>')
                    .replace(/\b(true|false|null)\b/g, '<span class="json-boolean">\$1</span>')
                    .replace(/\b(\d+)\b/g, '<span class="json-number">\$1</span>');

                document.getElementById('value-display').innerHTML = formattedValue;
                
                updateActiveStates();
            } catch (error) {
                console.error('Error loading value:', error);
                document.getElementById('value-display').innerHTML = 
                    '<div class="text-red-500 text-center py-4">Error loading value</div>';
            }
        }

        // Load collections when page loads
        document.addEventListener('DOMContentLoaded', loadCollections);
    </script>
</body>
</html>
`;

// Route to serve the database viewer UI
router.get("/db-viewer", (ctx) => {
  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.body = dbViewerUi;
});

// API endpoint to get all collections
router.get("/api/db/collections", async (ctx) => {
  try {
    const collections = Object.values(KV_COLLECTIONS);
    ctx.response.body = collections;
  } catch (error) {
    console.error("Error fetching collections:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch collections" };
  }
});

// API endpoint to get all keys in a collection
router.get("/api/db/collections/:collection/keys", async (ctx) => {
  try {
    const { collection } = ctx.params;
    const kv = getKv();
    const keys: string[] = [];

    // List all keys in the collection
    for await (const entry of kv.list({ prefix: [collection] })) {
      keys.push(entry.key[1] as string);
    }

    ctx.response.body = keys;
  } catch (error) {
    console.error("Error fetching keys:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch keys" };
  }
});

// API endpoint to get value for a specific key
router.get("/api/db/collections/:collection/keys/:key", async (ctx) => {
  try {
    const { collection, key } = ctx.params;
    const kv = getKv();
    const value = await kv.get([collection, key]);

    if (value.value === null) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Key not found" };
      return;
    }

    ctx.response.body = value.value;
  } catch (error) {
    console.error("Error fetching value:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch value" };
  }
});

export default router;
