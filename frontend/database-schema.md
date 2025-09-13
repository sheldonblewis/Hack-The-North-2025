# AI Red-Team Platform Database Schema

## Collections Overview

### Users Collection
```javascript
{
  _id: ObjectId,
  auth0_id: String, // Auth0 user ID
  email: String,
  name: String,
  role: "admin" | "analyst" | "viewer",
  organization_id: ObjectId,
  created_at: Date,
  last_active: Date,
  preferences: {
    dashboard_layout: Object,
    notification_settings: Object
  }
}
```

### Organizations Collection
```javascript
{
  _id: ObjectId,
  name: String,
  subscription_tier: "free" | "pro" | "enterprise",
  created_at: Date,
  settings: {
    retention_days: Number,
    max_agents: Number,
    features: Array
  }
}
```

### Agents Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  organization_id: ObjectId,
  name: String,
  description: String,
  model_config: {
    provider: "cohere" | "openai" | "anthropic" | "google" | "cerebras",
    model_name: String,
    api_endpoint: String,
    parameters: {
      temperature: Number,
      max_tokens: Number,
      // ... other model-specific params
    }
  },
  status: "active" | "paused" | "archived",
  created_at: Date,
  updated_at: Date,
  total_attacks: Number,
  last_tested: Date
}
```

### Attack Scenarios Collection
```javascript
{
  _id: ObjectId,
  name: String,
  category: "jailbreak" | "prompt_injection" | "toxicity" | "pii_extraction" | "social_engineering" | "context_manipulation",
  severity: "low" | "medium" | "high" | "critical",
  description: String,
  prompt_template: String,
  variables: Array, // For dynamic prompt generation
  success_criteria: {
    keywords: Array,
    patterns: Array,
    evaluation_method: String
  },
  created_by: ObjectId,
  organization_id: ObjectId,
  is_public: Boolean,
  tags: Array,
  created_at: Date,
  updated_at: Date
}
```

### Test Runs Collection
```javascript
{
  _id: ObjectId,
  agent_id: ObjectId,
  user_id: ObjectId,
  organization_id: ObjectId,
  name: String,
  status: "queued" | "running" | "completed" | "failed" | "cancelled",
  config: {
    attack_scenarios: Array, // Array of ObjectIds
    batch_size: Number,
    timeout: Number,
    retry_policy: Object
  },
  start_time: Date,
  end_time: Date,
  duration: Number, // seconds
  progress: {
    total: Number,
    completed: Number,
    failed: Number,
    success_rate: Number
  },
  results_summary: {
    total_attacks: Number,
    successful_attacks: Number,
    blocked_attacks: Number,
    risk_score: Number,
    top_vulnerabilities: Array
  },
  created_at: Date
}
```

### Attack Results Collection
```javascript
{
  _id: ObjectId,
  test_run_id: ObjectId,
  agent_id: ObjectId,
  attack_scenario_id: ObjectId,
  organization_id: ObjectId,

  // Attack details
  prompt_sent: String,
  response_received: String,

  // Results
  status: "success" | "partial" | "blocked" | "error",
  risk_level: "low" | "medium" | "high" | "critical",
  confidence_score: Number, // 0-1

  // Metadata
  timestamp: Date,
  response_time: Number, // milliseconds
  tokens_used: {
    input: Number,
    output: Number,
    total: Number
  },

  // Analysis
  flags: Array, // Array of detected issues
  evaluation_results: {
    automated_score: Number,
    human_reviewed: Boolean,
    reviewer_id: ObjectId,
    notes: String
  },

  // Tracing
  request_id: String,
  model_version: String
}
```

### Analytics Aggregations Collection
```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  agent_id: ObjectId, // null for org-wide stats

  // Time period
  period_type: "hourly" | "daily" | "weekly" | "monthly",
  period_start: Date,
  period_end: Date,

  // Metrics
  metrics: {
    total_attacks: Number,
    success_rate: Number,
    average_risk_score: Number,
    attack_distribution: {
      jailbreak: Number,
      prompt_injection: Number,
      toxicity: Number,
      pii_extraction: Number,
      social_engineering: Number,
      context_manipulation: Number
    },
    risk_distribution: {
      low: Number,
      medium: Number,
      high: Number,
      critical: Number
    },
    response_times: {
      min: Number,
      max: Number,
      avg: Number,
      p95: Number
    },
    token_usage: {
      total: Number,
      cost_estimate: Number
    }
  },

  computed_at: Date,
  version: Number
}
```

### Real-time Events Collection (Optional - for live monitoring)
```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  event_type: "attack_started" | "attack_completed" | "alert_triggered" | "agent_status_change",

  // Event data
  data: {
    agent_id: ObjectId,
    test_run_id: ObjectId,
    attack_result_id: ObjectId,
    message: String,
    severity: String,
    metadata: Object
  },

  // Stream processing
  timestamp: Date,
  processed: Boolean,
  ttl: Date // Auto-expire old events
}
```

### Reports Collection
```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  created_by: ObjectId,

  // Report details
  name: String,
  type: "vulnerability_assessment" | "compliance" | "trend_analysis" | "custom",
  format: "pdf" | "html" | "json" | "csv",

  // Data scope
  filters: {
    date_range: {
      start: Date,
      end: Date
    },
    agents: Array,
    attack_types: Array,
    risk_levels: Array
  },

  // Report content
  sections: Array, // Configuration for report sections

  // Status
  status: "generating" | "completed" | "failed",
  file_path: String, // Storage location
  file_size: Number,

  // Scheduling
  is_scheduled: Boolean,
  schedule: {
    frequency: "daily" | "weekly" | "monthly",
    recipients: Array,
    next_run: Date
  },

  created_at: Date,
  completed_at: Date
}
```

## Indexes for Performance

```javascript
// Users
db.users.createIndex({ "auth0_id": 1 }, { unique: true })
db.users.createIndex({ "organization_id": 1 })

// Agents
db.agents.createIndex({ "organization_id": 1, "status": 1 })
db.agents.createIndex({ "user_id": 1 })

// Attack Results (most queried collection)
db.attack_results.createIndex({ "test_run_id": 1 })
db.attack_results.createIndex({ "organization_id": 1, "timestamp": -1 })
db.attack_results.createIndex({ "agent_id": 1, "timestamp": -1 })
db.attack_results.createIndex({ "status": 1, "risk_level": 1 })

// Analytics
db.analytics_aggregations.createIndex({
  "organization_id": 1,
  "period_type": 1,
  "period_start": -1
})

// Real-time events (with TTL)
db.realtime_events.createIndex({ "ttl": 1 }, { expireAfterSeconds: 0 })
db.realtime_events.createIndex({
  "organization_id": 1,
  "timestamp": -1
})
```

## Integration Points

### Auth0 Integration
- Store `auth0_id` in users collection
- Use Auth0 user metadata for additional profile info
- Sync user changes via Auth0 webhooks

### Databricks Analytics Pipeline
- Daily/hourly ETL jobs to aggregate attack results
- Advanced analytics for trend detection
- Machine learning models for risk scoring
- Export processed data back to MongoDB

### API Considerations
- Use tRPC with MongoDB adapter
- Implement proper pagination for large result sets
- Cache frequently accessed data (agent configs, scenarios)
- Rate limiting per organization tier

## Hackathon Implementation Strategy

1. **Start with MongoDB Atlas** - Set up core collections first
2. **Implement Auth0 integration** - Get user authentication working
3. **Build basic CRUD operations** - Agents, scenarios, test runs
4. **Add Databricks layer** - For analytics processing
5. **Real-time features** - Use MongoDB change streams or DynamoDB

This schema supports your hackathon goals while positioning for multiple sponsor prizes!