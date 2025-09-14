# Whop Integration Testing Checklist

## 📋 Pre-Testing Setup

### Environment Configuration
- [ ] Copy `.env.example` to `.env.local`
- [ ] Add your Whop API key (`WHOP_API_KEY`)
- [ ] Add your Whop App ID (`NEXT_PUBLIC_WHOP_APP_ID`)
- [ ] Add webhook secret (`WHOP_WEBHOOK_SECRET`)
- [ ] Configure Convex URL and deploy key
- [ ] Add Replicate and OpenAI API keys

### Whop Dashboard Setup
- [ ] **Create Subscription Products:**
  - [ ] Starter Tier (100 credits/month) → Note `prod_xxx` ID
  - [ ] Growth Tier (500 credits/month) → Note `prod_xxx` ID
  - [ ] Pro Tier (1000 credits/month) → Note `prod_xxx` ID

- [ ] **Create Credit Pack Plans:**
  - [ ] Small Pack (100 credits @ $12) → Note `plan_xxx` ID
  - [ ] Medium Pack (500 credits @ $50) → Note `plan_xxx` ID
  - [ ] Large Pack (1000 credits @ $90) → Note `plan_xxx` ID

- [ ] **Configure Webhook:**
  - [ ] Add endpoint: `https://your-domain.com/api/webhooks/whop-payment`
  - [ ] Select events: `payment.succeeded`, `payment.failed`, `payment.refunded`
  - [ ] Copy webhook secret to `.env.local`

- [ ] **Update Environment Variables:**
  ```bash
  NEXT_PUBLIC_WHOP_STARTER_PRODUCT_ID=prod_xxx
  NEXT_PUBLIC_WHOP_GROWTH_PRODUCT_ID=prod_xxx
  NEXT_PUBLIC_WHOP_PRO_PRODUCT_ID=prod_xxx
  WHOP_SMALL_CREDIT_PLAN_ID=plan_xxx
  WHOP_MEDIUM_CREDIT_PLAN_ID=plan_xxx
  WHOP_LARGE_CREDIT_PLAN_ID=plan_xxx
  ```

## 🧪 Development Testing

### 1. Run Validation Script
```bash
npm run validate:whop
# or
tsx scripts/validate-whop-integration.ts
```

**Expected Results:**
- [ ] All environment variables configured ✅
- [ ] Whop API connection successful ✅
- [ ] Webhook configuration valid ✅
- [ ] Convex database connected ✅
- [ ] Products and plans configured ✅

### 2. Test Health Check Endpoint
```bash
curl http://localhost:3000/api/health/whop
```

**Verify:**
- [ ] Status is "healthy" or "degraded"
- [ ] All checks show "pass" or "warning"
- [ ] No "fail" status for critical components

### 3. Test Authentication Flow

**Development Mode:**
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to `http://localhost:3000/studio`
- [ ] Verify mock user is created (Pro tier, 1000 credits)
- [ ] Check console for authentication logs

**API Testing:**
```bash
curl -X POST http://localhost:3000/api/auth/whop \
  -H "Authorization: Bearer test_token"
```

- [ ] Returns user data or appropriate error
- [ ] Circuit breaker activates after 5 failures

### 4. Test Payment Flow

**Manual Testing:**
- [ ] Click "Buy Credits" button
- [ ] Select Small Pack (100 credits)
- [ ] Verify price shows $12
- [ ] Click purchase (dev mode simulates)
- [ ] Wait 2 seconds for simulation
- [ ] Verify success message

**API Testing:**
```bash
curl -X POST http://localhost:3000/api/charge \
  -H "Content-Type: application/json" \
  -d '{"creditsToPurchase": 100, "packSize": "small"}'
```

- [ ] Returns inAppPurchase object
- [ ] Contains id, amount, currency, metadata

### 5. Test Webhook Handling

**Run Webhook Simulator:**
```bash
npm run test:webhook
# or
tsx tests/whop-webhook-simulator.ts
```

**Test Scenarios:**
- [ ] Payment Success (Small Pack)
- [ ] Payment Success (Medium Pack)
- [ ] Payment Success (Large Pack)
- [ ] Payment Failure
- [ ] Payment Refund
- [ ] Idempotency (duplicate webhook)

**Manual Webhook Test:**
```bash
# Test payment success
curl -X POST http://localhost:3000/api/webhooks/whop-payment \
  -H "Content-Type: application/json" \
  -H "whop-signature: test_signature" \
  -d '{
    "type": "payment.succeeded",
    "data": {
      "payment_id": "pay_test_123",
      "user_id": "user_test",
      "amount": 1200,
      "metadata": {
        "creditsToPurchase": 100
      }
    }
  }'
```

### 6. Run Playwright Tests

**All Integration Tests:**
```bash
npm run test:whop
# or
npx playwright test tests/whop-integration.spec.ts
```

**Specific Test Groups:**
```bash
# Authentication tests only
npx playwright test tests/whop-integration.spec.ts -g "Authentication"

# Payment flow tests
npx playwright test tests/whop-integration.spec.ts -g "Payment Flow"

# Webhook tests
npx playwright test tests/whop-integration.spec.ts -g "Webhook"
```

## 🚀 Production Testing (Whop iframe)

### 1. Install App in Whop
- [ ] Upload app to Whop platform
- [ ] Install in test company
- [ ] Access through Whop dashboard

### 2. Test Authentication
- [ ] App loads in iframe
- [ ] User token validates correctly
- [ ] Correct subscription tier detected
- [ ] Credits display accurately

### 3. Test Real Payment Flow
- [ ] Click "Buy Credits"
- [ ] Select credit pack
- [ ] Whop payment modal appears
- [ ] Complete test payment
- [ ] Verify webhook received
- [ ] Check credits added to account
- [ ] Verify billing event logged

### 4. Test Subscription Features
- [ ] **Starter Tier:**
  - [ ] 100 credits/month
  - [ ] Basic features accessible
  - [ ] Premium features show upgrade prompts

- [ ] **Growth Tier:**
  - [ ] 500 credits/month
  - [ ] Advanced features unlocked
  - [ ] Bulk operations available

- [ ] **Pro Tier:**
  - [ ] 1000 credits/month
  - [ ] All features accessible
  - [ ] Priority processing active

### 5. Test Error Scenarios
- [ ] Invalid payment method
- [ ] Insufficient funds
- [ ] Network interruption during payment
- [ ] Webhook delivery failure and retry

## 📊 Monitoring & Validation

### Real-Time Monitoring
- [ ] Watch webhook logs in Convex dashboard
- [ ] Monitor `/api/health/whop` endpoint
- [ ] Check browser console for errors
- [ ] Review server logs for issues

### Database Validation
```bash
# Check Convex dashboard for:
```
- [ ] Users table has Whop user records
- [ ] Billing events are logged
- [ ] Credits are properly tracked
- [ ] Analytics events recorded

### Performance Metrics
- [ ] Health check responds < 1 second
- [ ] Payment flow completes < 5 seconds
- [ ] Webhook processing < 500ms
- [ ] Credit updates reflect immediately

## 🔍 Troubleshooting Guide

### Common Issues

**"Not in iframe" Error**
- Normal in development mode
- App auto-creates mock user
- Test in Whop dashboard for production

**401 Unauthorized**
- Check WHOP_API_KEY is valid
- Verify token in Authorization header
- Ensure app is installed in Whop

**Webhook Signature Invalid**
- Verify WHOP_WEBHOOK_SECRET matches dashboard
- Check signature generation algorithm
- Ensure raw body is used for signature

**Credits Not Added**
- Check webhook delivery in Whop dashboard
- Verify payment metadata includes creditsToPurchase
- Check Convex logs for errors
- Ensure idempotency isn't blocking

**Product IDs Not Working**
- Verify IDs match Whop dashboard exactly
- Check for typos or extra spaces
- Ensure products are active in Whop

## ✅ Production Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set in production
- [ ] Webhook URL configured in Whop dashboard
- [ ] Products and plans created and active
- [ ] SSL certificate valid for webhook endpoint
- [ ] Convex functions deployed

### Deployment
- [ ] Deploy to production environment
- [ ] Run validation script on production
- [ ] Test health check endpoint
- [ ] Verify webhook connectivity

### Post-Deployment
- [ ] Complete test purchase with real payment
- [ ] Verify credits added correctly
- [ ] Check analytics tracking
- [ ] Monitor error rates
- [ ] Set up alerts for failures

## 📈 Success Metrics

### Integration Health
- ✅ Health check shows "healthy" status
- ✅ Zero authentication failures in last hour
- ✅ Webhook success rate > 99%
- ✅ Credit fulfillment rate = 100%

### Performance Targets
- ✅ Payment flow < 5 seconds
- ✅ Webhook processing < 500ms
- ✅ Health check response < 1 second
- ✅ Zero duplicate credit additions

### Business Metrics
- ✅ Conversion rate on credit purchases
- ✅ Average transaction value
- ✅ Refund rate < 5%
- ✅ User satisfaction with payment flow

## 🆘 Support Resources

### Documentation
- [Whop SDK Documentation](https://docs.whop.com)
- [Convex Documentation](https://docs.convex.dev)
- [Project README](../README.md)
- [WHOP_INTEGRATION_GUIDE.md](../WHOP_INTEGRATION_GUIDE.md)

### Debugging Tools
- Validation Script: `scripts/validate-whop-integration.ts`
- Webhook Simulator: `tests/whop-webhook-simulator.ts`
- Health Check: `/api/health/whop`
- Playwright Tests: `tests/whop-integration.spec.ts`

### Contact
- Whop Support: support@whop.com
- Convex Support: support@convex.dev
- Internal Team: [Your contact info]

---

## Quick Commands Reference

```bash
# Validate configuration
npm run validate:whop

# Test webhooks
npm run test:webhook

# Run integration tests
npm run test:whop

# Check health
curl http://localhost:3000/api/health/whop

# Start development
npm run dev

# Deploy Convex functions
npm run convex:build
```

---

✅ **Integration Complete!** Follow this checklist to ensure your Whop integration is properly configured, tested, and ready for production.