#!/bin/bash

echo "Testing Analytics Accuracy"
echo "========================="

# Create a fresh test user
echo "1. Creating test user..."
USER_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"analytics_accuracy","email":"accuracy@test.com","password":"test123","firstName":"Analytics","lastName":"Accuracy"}' \
  -c /tmp/accuracy_test.txt)

USER_ID=$(echo $USER_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "✓ Created user: $USER_ID"

# Check initial state
echo "2. Checking initial analytics..."
INITIAL_STATS=$(curl -s -X GET "http://localhost:5000/api/user/stats" -b /tmp/accuracy_test.txt)
echo "Initial: $INITIAL_STATS"

# Simulate quiz session with multiple correct/incorrect answers
echo "3. Simulating quiz session..."

# Start quiz session
QUIZ_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/quiz/start" \
  -H "Content-Type: application/json" \
  -d '{"studyMode":"quiz","difficulty":"intermediate","totalQuestions":5,"mode":"quiz"}' \
  -b /tmp/accuracy_test.txt)

SESSION_ID=$(echo $QUIZ_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "✓ Started quiz session: $SESSION_ID"

# Submit 3 correct answers
echo "4. Submitting 3 correct answers..."
curl -s -X POST "http://localhost:5000/api/quiz/$SESSION_ID/answer" \
  -H "Content-Type: application/json" \
  -d '{"questionId":1,"answer":"Paris","responseTime":2000,"countryCode":"FR","correct":true}' \
  -b /tmp/accuracy_test.txt > /dev/null

curl -s -X POST "http://localhost:5000/api/quiz/$SESSION_ID/answer" \
  -H "Content-Type: application/json" \
  -d '{"questionId":2,"answer":"Berlin","responseTime":2500,"countryCode":"DE","correct":true}' \
  -b /tmp/accuracy_test.txt > /dev/null

curl -s -X POST "http://localhost:5000/api/quiz/$SESSION_ID/answer" \
  -H "Content-Type: application/json" \
  -d '{"questionId":3,"answer":"Madrid","responseTime":3000,"countryCode":"ES","correct":true}' \
  -b /tmp/accuracy_test.txt > /dev/null

# Submit 2 incorrect answers
echo "5. Submitting 2 incorrect answers..."
curl -s -X POST "http://localhost:5000/api/quiz/$SESSION_ID/answer" \
  -H "Content-Type: application/json" \
  -d '{"questionId":4,"answer":"Wrong","responseTime":4000,"countryCode":"IT","correct":false}' \
  -b /tmp/accuracy_test.txt > /dev/null

curl -s -X POST "http://localhost:5000/api/quiz/$SESSION_ID/answer" \
  -H "Content-Type: application/json" \
  -d '{"questionId":5,"answer":"Wrong","responseTime":5000,"countryCode":"PT","correct":false}' \
  -b /tmp/accuracy_test.txt > /dev/null

# Check final analytics
echo "6. Checking final analytics..."
FINAL_STATS=$(curl -s -X GET "http://localhost:5000/api/user/stats" -b /tmp/accuracy_test.txt)
DAILY_STATS=$(curl -s -X GET "http://localhost:5000/api/user/daily-stats" -b /tmp/accuracy_test.txt)
PROGRESS=$(curl -s -X GET "http://localhost:5000/api/user/progress" -b /tmp/accuracy_test.txt)

echo "Final stats: $FINAL_STATS"
echo "Daily stats: $DAILY_STATS"
echo "Progress entries: $(echo $PROGRESS | grep -o '"countryCode":"[^"]*"' | wc -l) countries tracked"

# Expected: 60% accuracy (3 correct / 5 total = 60%)
echo "7. Validating accuracy calculation..."
ACCURACY=$(echo $FINAL_STATS | grep -o '"accuracyRate":[0-9]*' | cut -d':' -f2)
QUESTIONS_ANSWERED=$(echo $DAILY_STATS | grep -o '"questionsAnswered":[0-9]*' | cut -d':' -f2)
QUESTIONS_CORRECT=$(echo $DAILY_STATS | grep -o '"questionsCorrect":[0-9]*' | cut -d':' -f2)

echo "Questions answered: $QUESTIONS_ANSWERED"
echo "Questions correct: $QUESTIONS_CORRECT"
echo "Calculated accuracy: $ACCURACY%"

if [ "$QUESTIONS_ANSWERED" = "5" ] && [ "$QUESTIONS_CORRECT" = "3" ]; then
    echo "✅ Question tracking is accurate!"
else
    echo "❌ Question tracking issue detected"
fi

echo "========================="
echo "Analytics accuracy test complete!"