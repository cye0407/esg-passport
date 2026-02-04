{
  "name": "ActionItem",
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
    "task_name": {
      "type": "string",
      "description": "Name of the task"
    },
    "description": {
      "type": "string",
      "description": "Task description"
    },
    "assignee_user_id": {
      "type": "string",
      "description": "User assigned to this task"
    },
    "due_date": {
      "type": "string",
      "format": "date",
      "description": "Task due date"
    },
    "status": {
      "type": "string",
      "enum": [
        "todo",
        "in_progress",
        "done"
 