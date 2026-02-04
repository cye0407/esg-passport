{
  "name": "MaterialTopic",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string",
      "description": "Reference to the company"
    },
    "topic_code": {
      "type": "string",
      "description": "Topic code (e.g., E1, S1, G1)"
    },
    "topic_name": {
      "type": "string",
      "description": "Full topic name"
    },
    "description": {
      "type": "string",
      "description": "Topic description"
    },
    "is_material": {
      "type": "boolean",
      "default": true,
      "description": "Whether this topic is confirmed as material"
    }
  },
  "required": [
    "company_id",
    "topic_code",
    "topic_name"
  ]
}