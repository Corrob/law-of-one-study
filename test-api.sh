#!/bin/bash

API_URL="https://law-of-one-study-kjf47x4dz-corrobs-projects.vercel.app/api/chat"
RESULTS_FILE="api-test-results.txt"

echo "🧪 Testing Two-Phase Prompting System API" > "$RESULTS_FILE"
echo "=========================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

test_query() {
    local id=$1
    local description=$2
    local query=$3
    local expected=$4

    echo "📝 Test $id: $description"
    echo "   Query: \"$query\""
    echo "   Expected: $expected"

    echo "" >> "$RESULTS_FILE"
    echo "Test $id: $description" >> "$RESULTS_FILE"
    echo "Query: $query" >> "$RESULTS_FILE"
    echo "Expected: $expected" >> "$RESULTS_FILE"

    # Make request and capture first 3000 chars
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"message\":\"$query\",\"history\":[]}" \
        --max-time 15 2>&1 | head -c 3000)

    # Count quotes (look for quote objects in meta event)
    quote_count=$(echo "$response" | grep -o '"text":' | wc -l)

    # Extract first chunk of text content
    text_preview=$(echo "$response" | grep 'event: chunk' -A 1 | grep 'data:' | head -3 | sed 's/data: //g')

    if [ -n "$response" ]; then
        echo "   ✅ Success"
        echo "   📖 Quotes found: $quote_count"
        echo "   📝 Response started"
    else
        echo "   ❌ No response"
    fi

    echo "Response (first 2000 chars):" >> "$RESULTS_FILE"
    echo "$response" | head -c 2000 >> "$RESULTS_FILE"
    echo "" >> "$RESULTS_FILE"
    echo "---" >> "$RESULTS_FILE"

    sleep 1
}

# Run tests
test_query 1 "RETRIEVE+CURIOUS+SURFACE" \
    "What did Ra say about wanderers?" \
    "RETRIEVE + CURIOUS + SURFACE"

test_query 2 "UNDERSTAND+SURFACE" \
    "What are densities?" \
    "UNDERSTAND + CURIOUS + SURFACE"

test_query 3 "UNDERSTAND+INTERMEDIATE" \
    "How does polarity relate to harvest?" \
    "UNDERSTAND + CURIOUS + INTERMEDIATE"

test_query 4 "UNDERSTAND+CHALLENGING" \
    "Ra's concept of free will seems to contradict predestination. How do you reconcile this?" \
    "UNDERSTAND + CHALLENGING + INTERMEDIATE"

test_query 5 "APPLY+PROCESSING+SURFACE" \
    "I'm struggling to forgive my father" \
    "APPLY + PROCESSING + SURFACE"

test_query 6 "User control: explain simply" \
    "Can you explain the octave simply? I'm new to this" \
    "UNDERSTAND + CURIOUS + SURFACE (user override)"

test_query 7 "APPLY+CURIOUS" \
    "How can I use Ra's teachings about catalyst in meditation?" \
    "APPLY + CURIOUS + INTERMEDIATE"

test_query 8 "RETRIEVE+SEEKING_VALIDATION" \
    "I remember Ra saying wanderers chose to help with harvest. Can you find that quote?" \
    "RETRIEVE + SEEKING_VALIDATION + INTERMEDIATE"

echo ""
echo "✅ Test complete! Results saved to $RESULTS_FILE"
echo ""
echo "To view full results: cat $RESULTS_FILE"
