# LLM Translation Cost Estimate

## Executive Summary

**Cost per 1,000 page views:**
- **With smart caching: $0.50 - $2.00**
- **Without caching (worst case): $15 - $50**

The vast majority of cost can be eliminated through intelligent caching strategies.

---

## Content Inventory

Based on codebase analysis, here's what needs translation per page view:

| Content Type | Volume | Frequency |
|-------------|--------|-----------|
| **Static UI strings** | ~500-700 distinct strings | Once, then cached |
| **Navigation & menus** | ~20 strings | Every page load (cacheable) |
| **Average page content** | 200-400 words | Every page load (cacheable) |
| **Chat AI responses** | 100-500 words | Per message (NOT cacheable) |
| **Study path lessons** | 300-800 words | Per lesson view (cacheable) |
| **About page** | 3,500 words | Rare views (cacheable) |

---

## Token & Cost Calculations

### Token Estimation
- 1 English word ≈ 1.3 tokens (industry average)
- Translation typically has 1:1 input:output ratio
- Average page: 300 words = **~780 tokens total** (390 input + 390 output)

### LLM Pricing (January 2026)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|----------------------|------------------------|----------|
| **GPT-4o-mini** | $0.15 | $0.60 | Recommended - Fast, cheap, good quality |
| **Claude 3 Haiku** | $0.25 | $1.25 | Alternative - Fast, slightly better quality |
| **GPT-4o** | $2.50 | $10.00 | Overkill for translation |
| **Claude 3.5 Sonnet** | $3.00 | $15.00 | Overkill for translation |

---

## Scenario 1: Smart Caching (RECOMMENDED)

### Strategy
1. **Pre-translate static content** (one-time cost)
2. **Cache all UI strings** by language
3. **Only translate dynamic content** (AI chat responses)
4. **Cache study path lessons** per language

### Cost Breakdown

**One-time setup cost:**
- Total UI strings: ~15,000 words = 19,500 tokens × 2 = 39,000 tokens
- Cost with GPT-4o-mini: **$0.029 per language** (one-time)
- 10 languages: **$0.29 total setup**

**Per 1,000 page views:**

Assuming page view distribution:
- 40% Landing/Browse pages: 200 words each (fully cached)
- 30% Chat interactions: 300 words AI response (NOT cached)
- 20% Study paths: 500 words (cached after first view)
- 10% About/Search: 400 words (cached)

Only the **30% chat responses** need real-time translation:
- 300 views × 300 words × 1.3 = 117,000 tokens × 2 = 234,000 tokens
- **Cost: $0.18 per 1,000 views** (GPT-4o-mini)
- **Cost: $0.35 per 1,000 views** (Claude 3 Haiku)

**Additional considerations:**
- Cache warm-up for new languages: +$0.10-0.50 per 1,000 views
- Context/system prompts overhead: +10-20%
- Error retries: +5%

**Total realistic cost: $0.50 - $2.00 per 1,000 views**

---

## Scenario 2: No Caching (WORST CASE)

### Strategy
Translate everything on every page load (not recommended, but theoretical maximum)

### Cost Breakdown

**Per 1,000 page views:**
- Average page: 300 words × 1.3 = 390 tokens × 2 = 780 tokens
- 1,000 views × 780 tokens = 780,000 tokens

| Model | Cost per 1,000 views |
|-------|---------------------|
| GPT-4o-mini | **$0.29** |
| Claude 3 Haiku | **$0.59** |
| GPT-4o | **$4.88** |
| Claude 3.5 Sonnet | **$5.85** |

**But this massively underestimates chat usage:**

If 50% of views involve sending 3 chat messages with 300-word responses:
- 500 users × 3 messages × 300 words × 1.3 × 2 = 1,170,000 additional tokens
- Total: ~1,950,000 tokens
- **Cost: $0.73** (GPT-4o-mini) or **$1.46** (Claude 3 Haiku)

**With heavy chat usage: $5-50 per 1,000 views** (depending on engagement)

---

## Scenario 3: Hybrid Approach (OPTIMAL)

### Strategy
1. **Pre-translate & cache** all static content
2. **Lazy-load translations** on first request, then cache
3. **Stream translate** chat responses in real-time
4. **Cache at CDN edge** for global performance

### Implementation Considerations

**Cache Keys:**
```
translation:{lang}:{contentType}:{contentId}
```

**Cache TTL:**
- Static UI: Infinite (invalidate on deploy)
- Study paths: 7 days
- Chat responses: Don't cache (user-specific context)

**Cost per 1,000 views: $0.50 - $2.00**

---

## Cost Comparison by Traffic Volume

| Monthly Views | Smart Caching | No Caching | Savings |
|--------------|---------------|------------|---------|
| 10,000 | $5-20 | $30-500 | 83-96% |
| 100,000 | $50-200 | $300-5,000 | 83-96% |
| 1,000,000 | $500-2,000 | $3,000-50,000 | 83-96% |

---

## Recommendations

### Immediate Implementation
1. **Use GPT-4o-mini** for translation (optimal cost/quality)
2. **Implement Redis/Vercel KV caching** for translated strings
3. **Pre-translate static content** during build time
4. **Only translate chat responses dynamically**

### Architecture

```typescript
// Pseudo-code
async function translateContent(text: string, targetLang: string) {
  // Check cache first
  const cached = await redis.get(`translation:${targetLang}:${hash(text)}`);
  if (cached) return cached;

  // Translate with LLM
  const translated = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `Translate to ${targetLang}. Preserve {{QUOTE:N}} markers.` },
      { role: "user", content: text }
    ]
  });

  // Cache for 7 days
  await redis.setex(`translation:${targetLang}:${hash(text)}`, 604800, translated);
  return translated;
}
```

### Cost Optimization Tips

1. **Batch translations** where possible (up to 5-10 strings per request)
2. **Use streaming** for chat responses (better UX, same cost)
3. **Implement fallback** to English if translation fails
4. **Monitor cache hit rates** (target >95% for static content)
5. **Pre-warm cache** for top 5 languages during off-peak hours

---

## Additional Costs to Consider

### Infrastructure
- **Redis/Vercel KV**: $0.20 per 100k reads (negligible with caching)
- **CDN bandwidth**: Translations add ~30% to response size
- **Compute time**: +50-200ms per translation request

### Quality Assurance
- **Human review**: $0.05-0.15 per word (one-time per language)
- **Spot-check audits**: $50-200/month for top languages

---

## Conclusion

**For 1,000 page views with smart caching:**
- **Minimum (mostly static pages): $0.50**
- **Average (mixed usage): $1.00-1.50**
- **Maximum (heavy chat usage): $2.00-3.00**

**ROI Calculation:**
If international users represent 30% of potential audience and translation increases conversion by 50%:
- Cost: $1.50 per 1,000 views
- Value: 150 additional engaged users per 1,000 views
- **Cost per acquired user: $0.01**

This is exceptionally cost-effective for expanding global reach.
