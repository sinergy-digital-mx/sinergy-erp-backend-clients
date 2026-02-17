#!/bin/bash

# Get fresh token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"christopher.sandoval@test.com","password":"123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
TENANT_ID="54481b63-5516-458d-9bb3-d4e5cb028864"

echo "Token: $TOKEN"
echo ""
echo "Testing /api/tenant/users endpoint..."
echo ""

curl -v -X GET http://localhost:3001/api/tenant/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json"
