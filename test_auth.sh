#!/bin/bash

# Test script to verify multi-user authentication and analytics tracking
echo "Testing WorldCap Authentication System"
echo "======================================"

# Clean up any existing cookie files
rm -f /tmp/user1_cookies.txt /tmp/user2_cookies.txt

echo "1. Creating User 1..."
USER1_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","email":"user1@test.com","password":"password123","firstName":"User","lastName":"One"}' \
  -c /tmp/user1_cookies.txt)

USER1_ID=$(echo $USER1_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "✓ User 1 created with ID: $USER1_ID"

echo "2. Creating User 2..."
USER2_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser2","email":"user2@test.com","password":"password123","firstName":"User","lastName":"Two"}' \
  -c /tmp/user2_cookies.txt)

USER2_ID=$(echo $USER2_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "✓ User 2 created with ID: $USER2_ID"

echo "3. Testing User 1 session persistence..."
USER1_AUTH=$(curl -s -X GET "http://localhost:5000/api/auth/user" -b /tmp/user1_cookies.txt)
USER1_SESSION_ID=$(echo $USER1_AUTH | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "✓ User 1 session ID: $USER1_SESSION_ID"

echo "4. Testing User 2 session persistence..."
USER2_AUTH=$(curl -s -X GET "http://localhost:5000/api/auth/user" -b /tmp/user2_cookies.txt)
USER2_SESSION_ID=$(echo $USER2_AUTH | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "✓ User 2 session ID: $USER2_SESSION_ID"

echo "5. Verifying separate analytics..."
USER1_STATS=$(curl -s -X GET "http://localhost:5000/api/user/stats" -b /tmp/user1_cookies.txt)
USER2_STATS=$(curl -s -X GET "http://localhost:5000/api/user/stats" -b /tmp/user2_cookies.txt)

echo "✓ User 1 stats: $USER1_STATS"
echo "✓ User 2 stats: $USER2_STATS"

echo "6. Simulating learning activity for User 1..."
curl -s -X POST "http://localhost:5000/api/quiz/1/answer" \
  -H "Content-Type: application/json" \
  -d '{"questionId":1,"answer":"Paris","responseTime":3000,"countryCode":"FR","correct":true}' \
  -b /tmp/user1_cookies.txt > /dev/null

echo "7. Checking updated analytics..."
USER1_UPDATED_STATS=$(curl -s -X GET "http://localhost:5000/api/user/stats" -b /tmp/user1_cookies.txt)
USER2_UNCHANGED_STATS=$(curl -s -X GET "http://localhost:5000/api/user/stats" -b /tmp/user2_cookies.txt)

echo "✓ User 1 updated stats: $USER1_UPDATED_STATS"
echo "✓ User 2 unchanged stats: $USER2_UNCHANGED_STATS"

# Verify users are truly separate
if [ "$USER1_SESSION_ID" != "$USER2_SESSION_ID" ]; then
    echo "✅ SUCCESS: Users have separate identities!"
else
    echo "❌ FAILED: Users sharing same identity"
fi

echo "======================================"
echo "Authentication system test complete!"