#!/bin/bash

# Login as admin user
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rodolfo.rodriguez@test.com","password":"123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
TENANT_ID="54481b63-5516-458d-9bb3-d4e5cb028864"
USER_ID="0ff6140a-2ff9-4e34-a01d-311bf5512a17"

echo "Token: $TOKEN"
echo ""
echo "Testing /api/tenant/users/$USER_ID/roles endpoint..."
echo ""

curl -X GET http://localhost:3001/api/tenant/users/$USER_ID/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json"
