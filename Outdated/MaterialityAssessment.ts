{
  "name": "MaterialityAssessment",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string",
      "description": "Reference to the company"
    },
    "question_number": {
      "type": "number",
      "description": "Question number (1-8)"
    },
    "answer": {
      "type": "string",
      "enum": [
        "yes",
        "no",
        "unsure"
      ],
      "description": "User's answer"
    },
    "completed_at": {
      "type": "string",
      "format": "date-time",
      "description": "When the answer was submitted"
    }
  },
  "required": [
    "company_id",
    "question_number",
    "answer"
  ]
}