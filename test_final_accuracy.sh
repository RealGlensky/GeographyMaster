#!/bin/bash

echo "Final Analytics Accuracy Test"
echo "============================="

# Create a completely unique test user
TIMESTAMP=$(date +%s)
USERNAME="accuracy_final_$TIMESTAMP"
EMAIL="final_$TIMESTAMP@test.com"

echo "1. Creating unique test user..."
USER_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"test123\",\"firstName\":\"Final\",\"lastName\":\"Test\"}" \
  -c /tmp/final_test.txt)

USER_ID=$(echo $USER_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "✓ Created user: $USER_ID"

if [ -z "$USER_ID" ]; then
    echo "❌ Failed to create user"
    exit 1
fi

# Check initial state
echo "2. Checking initial analytics..."
INITIAL_STATS=$(curl -s -X GET "http://localhost:5000/api/user/stats" -b /tmp/final_test.txt)
echo "Initial: $INITIAL_STATS"

# Simulate 3 quiz answers: 2 correct, 1 incorrect
echo "3. Simulating quiz answers..."

# Start quiz session
QUIZ_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/quiz/start" \
  -H "Content-Type: application/json" \
  -d '{"studyMode":"quiz","difficulty":"intermediate","totalQuestions":3,"mode":"quiz"}' \
  -b /tmp/final_test.txt)

SESSION_ID=$(echo $QUIZ_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "✓ Started quiz session: $SESSION_ID"

# Submit answers
curl -s -X POST "http://localhost:5000/api/quiz/$SESSION_ID/answer" \
  -H "Content-Type: application/json" \
  -d '{"questionId":1,"answer":"Paris","responseTime":2000,"countryCode":"FR","correct":true}' \
  -b /tmp/final_test.txt > /dev/null

curl -s -X POST "http://localhost:5000/api/quiz/$SESSION_ID/answer" \
  -H "Content-Type: application/json" \
  -d '{"questionId":2,"answer":"Berlin","responseTime":2500,"countryCode":"DE","correct":true}' \
  -b /tmp/final_test.txt > /dev/null

curl -s -X POST "http://localhost:5000/api/quiz/$SESSION_ID/answer" \
  -H "Content-Type: application/json" \
  -d '{"questionId":3,"answer":"Wrong","responseTime":3000,"countryCode":"ES","correct":false}' \
  -b /tmp/final_test.txt > /dev/null

echo "4. Checking final analytics..."
FINAL_STATS=$(curl -s -X GET "http://localhost:5000/api/user/stats" -b /tmp/final_test.txt)
echo "Final stats: $FINAL_STATS"

# Check individual tracking
PROGRESS=$(curl -s -X GET "http://localhost:5000/api/user/progress" -b /tmp/final_test.txt)
PROGRESS_COUNT=$(echo $PROGRESS | grep -o '"countryCode":"[^"]*"' | wc -l)
echo "Countries tracked: $PROGRESS_COUNT"

# Verify accuracy calculation (should be 67% = 2/3)
ACCURACY=$(echo $FINAL_STATS | grep -o '"accuracyRate":[0-9]*' | cut -d':' -f2)
echo "Calculated accuracy: $ACCURACY%"

if [ "$ACCURACY" = "67" ] || [ "$ACCURACY" = "66" ]; then
    echo "✅ Analytics accuracy tracking is WORKING!"
else
    echo "❌ Analytics accuracy issue detected - Expected ~67%, got $ACCURACY%"
fi

echo "============================="
echo "Final test complete!"