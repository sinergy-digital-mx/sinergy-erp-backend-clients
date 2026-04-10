# 🔌 API Examples - Tenant Modules Admin

Ejemplos de cómo usar la API desde diferentes lenguajes y herramientas.

---

## 📋 Base URL
```
http://localhost:3001/admin/tenant-modules
```

---

## 🌐 JavaScript (Fetch API)

### Listar Tenants
```javascript
fetch('http://localhost:3001/admin/tenant-modules/tenants')
  .then(res => res.json())
  .then(data => {
    console.log('Tenants:', data.tenants);
  });
```

### Obtener Módulos de un Tenant
```javascript
const tenantId = 'your-tenant-id';

fetch(`http://localhost:3001/admin/tenant-modules/tenants/${tenantId}/modules`)
  .then(res => res.json())
  .then(data => {
    console.log('Tenant:', data.tenant);
    console.log('Modules:', data.modules);
  });
```

### Habilitar un Módulo
```javascript
const tenantId = 'your-tenant-id';
const moduleId = 'your-module-id';

fetch(`http://localhost:3001/admin/tenant-modules/tenants/${tenantId}/modules/${moduleId}/enable`, {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => {
    console.log('Result:', data.message);
  });
```

### Habilitar Todos los Módulos
```javascript
const tenantId = 'your-tenant-id';

fetch(`http://localhost:3001/admin/tenant-modules/tenants/${tenantId}/modules/enable-all`, {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => {
    console.log('Result:', data.message);
  });
```

---

## 🐍 Python (requests)

### Instalar requests
```bash
pip install requests
```

### Listar Tenants
```python
import requests

response = requests.get('http://localhost:3001/admin/tenant-modules/tenants')
data = response.json()

for tenant in data['tenants']:
    print(f"{tenant['name']} - {tenant['subdomain']}")
```

### Obtener Módulos de un Tenant
```python
import requests

tenant_id = 'your-tenant-id'
response = requests.get(f'http://localhost:3001/admin/tenant-modules/tenants/{tenant_id}/modules')
data = response.json()

print(f"Tenant: {data['tenant']['name']}")
for module in data['modules']:
    status = '✅' if module['isEnabled'] else '❌'
    print(f"{status} {module['name']} ({module['code']})")
```

### Habilitar un Módulo
```python
import requests

tenant_id = 'your-tenant-id'
module_id = 'your-module-id'

response = requests.post(
    f'http://localhost:3001/admin/tenant-modules/tenants/{tenant_id}/modules/{module_id}/enable'
)
result = response.json()
print(result['message'])
```

### Script Completo
```python
import requests
import json

BASE_URL = 'http://localhost:3001/admin/tenant-modules'

def list_tenants():
    response = requests.get(f'{BASE_URL}/tenants')
    return response.json()['tenants']

def get_tenant_modules(tenant_id):
    response = requests.get(f'{BASE_URL}/tenants/{tenant_id}/modules')
    return response.json()

def enable_module(tenant_id, module_id):
    response = requests.post(f'{BASE_URL}/tenants/{tenant_id}/modules/{module_id}/enable')
    return response.json()

def enable_all_modules(tenant_id):
    response = requests.post(f'{BASE_URL}/tenants/{tenant_id}/modules/enable-all')
    return response.json()

# Uso
if __name__ == '__main__':
    # Listar tenants
    tenants = list_tenants()
    print("Tenants disponibles:")
    for i, tenant in enumerate(tenants, 1):
        print(f"{i}. {tenant['name']} ({tenant['id']})")
    
    # Seleccionar tenant
    tenant_id = tenants[0]['id']
    
    # Ver módulos
    data = get_tenant_modules(tenant_id)
    print(f"\nMódulos de {data['tenant']['name']}:")
    for module in data['modules']:
        status = '✅' if module['isEnabled'] else '❌'
        print(f"{status} {module['name']}")
    
    # Habilitar todos
    result = enable_all_modules(tenant_id)
    print(f"\n{result['message']}")
```

---

## 🔴 Node.js (axios)

### Instalar axios
```bash
npm install axios
```

### Script Completo
```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/admin/tenant-modules';

async function listTenants() {
  const response = await axios.get(`${BASE_URL}/tenants`);
  return response.data.tenants;
}

async function getTenantModules(tenantId) {
  const response = await axios.get(`${BASE_URL}/tenants/${tenantId}/modules`);
  return response.data;
}

async function enableModule(tenantId, moduleId) {
  const response = await axios.post(
    `${BASE_URL}/tenants/${tenantId}/modules/${moduleId}/enable`
  );
  return response.data;
}

async function enableAllModules(tenantId) {
  const response = await axios.post(
    `${BASE_URL}/tenants/${tenantId}/modules/enable-all`
  );
  return response.data;
}

async function main() {
  try {
    // Listar tenants
    const tenants = await listTenants();
    console.log('Tenants disponibles:');
    tenants.forEach((tenant, i) => {
      console.log(`${i + 1}. ${tenant.name} (${tenant.id})`);
    });

    // Seleccionar primer tenant
    const tenantId = tenants[0].id;

    // Ver módulos
    const data = await getTenantModules(tenantId);
    console.log(`\nMódulos de ${data.tenant.name}:`);
    data.modules.forEach(module => {
      const status = module.isEnabled ? '✅' : '❌';
      console.log(`${status} ${module.name} (${module.code})`);
    });

    // Habilitar todos
    const result = await enableAllModules(tenantId);
    console.log(`\n${result.message}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

---

## 💻 PowerShell

### Listar Tenants
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/admin/tenant-modules/tenants"
$response.tenants | Format-Table name, subdomain, isActive
```

### Obtener Módulos de un Tenant
```powershell
$tenantId = "your-tenant-id"
$response = Invoke-RestMethod -Uri "http://localhost:3001/admin/tenant-modules/tenants/$tenantId/modules"

Write-Host "Tenant: $($response.tenant.name)"
$response.modules | Select-Object name, code, isEnabled | Format-Table
```

### Habilitar un Módulo
```powershell
$tenantId = "your-tenant-id"
$moduleId = "your-module-id"

$response = Invoke-RestMethod `
  -Uri "http://localhost:3001/admin/tenant-modules/tenants/$tenantId/modules/$moduleId/enable" `
  -Method Post

Write-Host $response.message
```

### Script Completo
```powershell
$BASE_URL = "http://localhost:3001/admin/tenant-modules"

# Listar tenants
$tenants = (Invoke-RestMethod -Uri "$BASE_URL/tenants").tenants
Write-Host "Tenants disponibles:" -ForegroundColor Cyan
$tenants | ForEach-Object { Write-Host "  - $($_.name) ($($_.id))" }

# Seleccionar primer tenant
$tenantId = $tenants[0].id

# Ver módulos
$data = Invoke-RestMethod -Uri "$BASE_URL/tenants/$tenantId/modules"
Write-Host "`nMódulos de $($data.tenant.name):" -ForegroundColor Cyan
$data.modules | ForEach-Object {
    $status = if ($_.isEnabled) { "✅" } else { "❌" }
    Write-Host "  $status $($_.name) ($($_.code))"
}

# Habilitar todos
$result = Invoke-RestMethod -Uri "$BASE_URL/tenants/$tenantId/modules/enable-all" -Method Post
Write-Host "`n$($result.message)" -ForegroundColor Green
```

---

## 🐚 Bash (curl + jq)

### Instalar jq
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

### Listar Tenants
```bash
curl -s http://localhost:3001/admin/tenant-modules/tenants | jq '.tenants[] | {name, subdomain, id}'
```

### Obtener Módulos de un Tenant
```bash
TENANT_ID="your-tenant-id"
curl -s "http://localhost:3001/admin/tenant-modules/tenants/$TENANT_ID/modules" | jq '.'
```

### Habilitar un Módulo
```bash
TENANT_ID="your-tenant-id"
MODULE_ID="your-module-id"

curl -X POST "http://localhost:3001/admin/tenant-modules/tenants/$TENANT_ID/modules/$MODULE_ID/enable" | jq '.'
```

### Script Completo
```bash
#!/bin/bash

BASE_URL="http://localhost:3001/admin/tenant-modules"

# Listar tenants
echo "Tenants disponibles:"
curl -s "$BASE_URL/tenants" | jq -r '.tenants[] | "\(.name) - \(.id)"'

# Obtener primer tenant ID
TENANT_ID=$(curl -s "$BASE_URL/tenants" | jq -r '.tenants[0].id')
echo -e "\nUsando tenant: $TENANT_ID"

# Ver módulos
echo -e "\nMódulos:"
curl -s "$BASE_URL/tenants/$TENANT_ID/modules" | jq -r '.modules[] | "\(if .isEnabled then "✅" else "❌" end) \(.name) (\(.code))"'

# Habilitar todos
echo -e "\nHabilitando todos los módulos..."
curl -s -X POST "$BASE_URL/tenants/$TENANT_ID/modules/enable-all" | jq -r '.message'
```

---

## 🦀 Rust (reqwest)

### Cargo.toml
```toml
[dependencies]
reqwest = { version = "0.11", features = ["json"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### main.rs
```rust
use reqwest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct Tenant {
    id: String,
    name: String,
    subdomain: String,
}

#[derive(Debug, Deserialize)]
struct TenantsResponse {
    tenants: Vec<Tenant>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let base_url = "http://localhost:3001/admin/tenant-modules";
    
    // Listar tenants
    let response = reqwest::get(format!("{}/tenants", base_url))
        .await?
        .json::<TenantsResponse>()
        .await?;
    
    println!("Tenants disponibles:");
    for tenant in &response.tenants {
        println!("  - {} ({})", tenant.name, tenant.id);
    }
    
    // Habilitar módulo
    let tenant_id = &response.tenants[0].id;
    let module_id = "your-module-id";
    
    let client = reqwest::Client::new();
    let result = client
        .post(format!("{}/tenants/{}/modules/{}/enable", base_url, tenant_id, module_id))
        .send()
        .await?;
    
    println!("Status: {}", result.status());
    
    Ok(())
}
```

---

## 🔵 Go

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

type Tenant struct {
    ID        string `json:"id"`
    Name      string `json:"name"`
    Subdomain string `json:"subdomain"`
}

type TenantsResponse struct {
    Tenants []Tenant `json:"tenants"`
}

func main() {
    baseURL := "http://localhost:3001/admin/tenant-modules"
    
    // Listar tenants
    resp, err := http.Get(baseURL + "/tenants")
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    
    var tenantsResp TenantsResponse
    json.Unmarshal(body, &tenantsResp)
    
    fmt.Println("Tenants disponibles:")
    for _, tenant := range tenantsResp.Tenants {
        fmt.Printf("  - %s (%s)\n", tenant.Name, tenant.ID)
    }
    
    // Habilitar módulo
    tenantID := tenantsResp.Tenants[0].ID
    moduleID := "your-module-id"
    
    url := fmt.Sprintf("%s/tenants/%s/modules/%s/enable", baseURL, tenantID, moduleID)
    resp, err = http.Post(url, "application/json", nil)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
    
    fmt.Printf("Status: %s\n", resp.Status)
}
```

---

## 🧪 Postman Collection

### Importar en Postman

```json
{
  "info": {
    "name": "Tenant Modules Admin",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "List Tenants",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3001/admin/tenant-modules/tenants",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["admin", "tenant-modules", "tenants"]
        }
      }
    },
    {
      "name": "Get Tenant Modules",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3001/admin/tenant-modules/tenants/:tenantId/modules",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["admin", "tenant-modules", "tenants", ":tenantId", "modules"],
          "variable": [
            {
              "key": "tenantId",
              "value": "your-tenant-id"
            }
          ]
        }
      }
    },
    {
      "name": "Enable Module",
      "request": {
        "method": "POST",
        "header": [],
        "url": {
          "raw": "http://localhost:3001/admin/tenant-modules/tenants/:tenantId/modules/:moduleId/enable",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["admin", "tenant-modules", "tenants", ":tenantId", "modules", ":moduleId", "enable"],
          "variable": [
            {
              "key": "tenantId",
              "value": "your-tenant-id"
            },
            {
              "key": "moduleId",
              "value": "your-module-id"
            }
          ]
        }
      }
    },
    {
      "name": "Enable All Modules",
      "request": {
        "method": "POST",
        "header": [],
        "url": {
          "raw": "http://localhost:3001/admin/tenant-modules/tenants/:tenantId/modules/enable-all",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["admin", "tenant-modules", "tenants", ":tenantId", "modules", "enable-all"],
          "variable": [
            {
              "key": "tenantId",
              "value": "your-tenant-id"
            }
          ]
        }
      }
    }
  ]
}
```

---

## 📱 React Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/admin/tenant-modules';

function TenantModulesAdmin() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    const response = await axios.get(`${BASE_URL}/tenants`);
    setTenants(response.data.tenants);
  };

  const loadModules = async (tenantId) => {
    const response = await axios.get(`${BASE_URL}/tenants/${tenantId}/modules`);
    setSelectedTenant(response.data.tenant);
    setModules(response.data.modules);
  };

  const toggleModule = async (moduleId, isEnabled) => {
    const action = isEnabled ? 'disable' : 'enable';
    await axios.post(
      `${BASE_URL}/tenants/${selectedTenant.id}/modules/${moduleId}/${action}`
    );
    loadModules(selectedTenant.id);
  };

  return (
    <div>
      <h1>Tenant Modules Admin</h1>
      
      <select onChange={(e) => loadModules(e.target.value)}>
        <option value="">Select Tenant</option>
        {tenants.map(tenant => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>

      {selectedTenant && (
        <div>
          <h2>{selectedTenant.name}</h2>
          <div className="modules-grid">
            {modules.map(module => (
              <div
                key={module.id}
                className={`module-card ${module.isEnabled ? 'enabled' : 'disabled'}`}
                onClick={() => toggleModule(module.id, module.isEnabled)}
              >
                <h3>{module.name}</h3>
                <p>{module.code}</p>
                <span>{module.isEnabled ? '✅ Enabled' : '❌ Disabled'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TenantModulesAdmin;
```

---

¡Usa el ejemplo que prefieras según tu stack tecnológico!
