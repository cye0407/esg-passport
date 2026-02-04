{
  "name": "Document",
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
    "filename": {
      "type": "string",
      "description": "Original filename"
    },
    "file_url": {
      "type": "string",
      "description": "URL to the uploaded file"
    },
    "file_size": {
      "type": "number",
      "description": "File size in bytes"
    },
    "file_type": {
      "type": "string",
      "description": "MIME type of the file"
    }
  },
  "required": [
    "company_id",
    "topic_id",
    "filename",
    "file_url"
  ]
}