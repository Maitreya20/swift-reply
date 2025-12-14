# n8n Automation Worker Specification

## Overview
This n8n workflow acts as a **private automation worker**. It is triggered exclusively by the backend via a secure webhook and handles the actual message sending (WhatsApp → SMS fallback).

---

## 1. Workflow Design Principles

- **Stateless**: No tenant logic, no business rules
- **Single purpose**: Send message, report status
- **Secure**: Only accepts authenticated webhooks from backend
- **Idempotent**: Can safely retry the same job

---

## 2. Node-by-Node Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     n8n SEND MESSAGE WORKFLOW                    │
└─────────────────────────────────────────────────────────────────┘

   ┌──────────────┐
   │   Webhook    │  ← Receives job from backend
   │   Trigger    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Validate   │  ← Check required fields
   │   Payload    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Send via   │  ← Try WhatsApp first
   │   WhatsApp   │
   └──────┬───────┘
          │
     ┌────┴────┐
     │         │
   Success   Failed
     │         │
     ▼         ▼
   ┌────┐   ┌──────────────┐
   │ OK │   │   Send via   │  ← Fallback to SMS
   └────┘   │     SMS      │
            └──────┬───────┘
                   │
              ┌────┴────┐
              │         │
            Success   Failed
              │         │
              ▼         ▼
            ┌────┐   ┌──────────────┐
            │ OK │   │ Mark Failed  │
            └────┘   └──────────────┘
                            │
                            ▼
                   ┌──────────────┐
                   │   Callback   │  ← Report status to backend
                   │   to Backend │
                   └──────────────┘
```

---

## 3. Detailed Node Configuration

### Node 1: Webhook Trigger

```json
{
  "name": "Receive Message Job",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "send-message",
    "httpMethod": "POST",
    "authentication": "headerAuth",
    "responseMode": "lastNode"
  },
  "credentials": {
    "headerAuth": {
      "name": "Backend Auth",
      "value": "X-Webhook-Secret"
    }
  }
}
```

**Expected Payload:**
```json
{
  "job_id": "uuid",
  "to_phone": "+15551234567",
  "from_phone": "+15559876543",
  "message_body": "Hello! Your appointment is confirmed for tomorrow at 2 PM.",
  "prefer_whatsapp": true,
  "callback_url": "https://api.callflow.app/webhooks/n8n-callback",
  "callback_secret": "hmac-secret-for-this-job"
}
```

---

### Node 2: Validate Payload

```json
{
  "name": "Validate Payload",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "string": [
        {
          "value1": "={{ $json.job_id }}",
          "operation": "isNotEmpty"
        },
        {
          "value1": "={{ $json.to_phone }}",
          "operation": "regex",
          "value2": "^\\+[1-9]\\d{6,14}$"
        },
        {
          "value1": "={{ $json.message_body }}",
          "operation": "isNotEmpty"
        }
      ]
    }
  }
}
```

**On Invalid → Return Error:**
```json
{
  "name": "Return Validation Error",
  "type": "n8n-nodes-base.respondToWebhook",
  "parameters": {
    "responseCode": 400,
    "responseBody": {
      "error": "Invalid payload",
      "job_id": "={{ $json.job_id }}"
    }
  }
}
```

---

### Node 3: Send via WhatsApp

```json
{
  "name": "Send WhatsApp",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://graph.facebook.com/v18.0/{{ $credentials.whatsappPhoneId }}/messages",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "whatsAppBusinessCloudApi",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "messaging_product",
          "value": "whatsapp"
        },
        {
          "name": "to",
          "value": "={{ $json.to_phone.replace('+', '') }}"
        },
        {
          "name": "type",
          "value": "text"
        },
        {
          "name": "text.body",
          "value": "={{ $json.message_body }}"
        }
      ]
    },
    "options": {
      "timeout": 10000
    }
  },
  "continueOnFail": true
}
```

---

### Node 4: Check WhatsApp Result

```json
{
  "name": "WhatsApp Success?",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.messages && $json.messages[0].id }}",
          "value2": true
        }
      ]
    }
  }
}
```

---

### Node 5: Send via SMS (Fallback)

```json
{
  "name": "Send SMS Fallback",
  "type": "n8n-nodes-base.twilio",
  "parameters": {
    "operation": "send",
    "from": "={{ $('Receive Message Job').item.json.from_phone }}",
    "to": "={{ $('Receive Message Job').item.json.to_phone }}",
    "message": "={{ $('Receive Message Job').item.json.message_body }}"
  },
  "credentials": {
    "twilioApi": "Twilio Credentials"
  },
  "continueOnFail": true
}
```

---

### Node 6: Prepare Callback Payload

```json
{
  "name": "Prepare Callback",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "values": {
      "string": [
        {
          "name": "job_id",
          "value": "={{ $('Receive Message Job').item.json.job_id }}"
        },
        {
          "name": "status",
          "value": "={{ $json.sid ? 'sent' : 'failed' }}"
        },
        {
          "name": "channel",
          "value": "={{ $('WhatsApp Success?').item ? 'whatsapp' : 'sms' }}"
        },
        {
          "name": "provider_message_id",
          "value": "={{ $json.messages?.[0]?.id || $json.sid || null }}"
        },
        {
          "name": "error_message",
          "value": "={{ $json.error?.message || null }}"
        }
      ]
    }
  }
}
```

---

### Node 7: Send Callback to Backend

```json
{
  "name": "Callback to Backend",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "={{ $('Receive Message Job').item.json.callback_url }}",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "X-Webhook-Signature",
          "value": "={{ $hmac($json, $('Receive Message Job').item.json.callback_secret, 'sha256') }}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "=",
          "value": "={{ JSON.stringify($json) }}"
        }
      ]
    }
  }
}
```

---

### Node 8: Respond to Webhook

```json
{
  "name": "Respond Success",
  "type": "n8n-nodes-base.respondToWebhook",
  "parameters": {
    "responseCode": 200,
    "responseBody": {
      "accepted": true,
      "job_id": "={{ $('Receive Message Job').item.json.job_id }}"
    }
  }
}
```

---

## 4. Error Handling

| Error Type | Behavior |
|------------|----------|
| Invalid payload | Return 400 immediately |
| WhatsApp fails | Try SMS fallback |
| SMS fails | Mark as failed, callback with error |
| Callback fails | Log error, workflow still succeeds |
| Timeout | n8n auto-retries based on settings |

---

## 5. Retry Configuration

```json
{
  "settings": {
    "maxTries": 3,
    "waitBetweenTries": 5000,
    "continueOnFail": false
  }
}
```

---

## 6. Security Measures

1. **Webhook Authentication**
   - Require `X-Webhook-Secret` header
   - Secret stored in n8n credentials

2. **Callback Signing**
   - HMAC-SHA256 signature in `X-Webhook-Signature`
   - Per-job secret prevents replay attacks

3. **No Data Storage**
   - n8n execution history disabled for production
   - No PII logged

4. **Network Isolation**
   - n8n runs in private network
   - Only backend can reach webhook URL
   - Egress limited to WhatsApp/Twilio APIs

---

## 7. Monitoring

- **Execution metrics**: Track success/failure rates
- **Latency**: Alert if p95 > 10 seconds
- **Error patterns**: Group by error type for debugging
