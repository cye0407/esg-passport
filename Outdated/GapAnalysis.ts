{
  "name": "GapAnalysis",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string",
      "description": "Reference to the company"
    },
    "topic_id": {
      "type": "string",
      "description": "Reference to the material topic"
    },
    "rag_status": {
      "type": "string",
      "enum": [
        "red",
        "amber",
        "green"
      ],
      "description": "Red/Amber/Green readiness status"
    },
    "notes": {
      "type": "string",
      "description": "User notes for this topic"
    },
    "checklist": {
      "type": "object",
      "description": "Checklist items completion status",
      "additionalProperties": true
    }
  },
 