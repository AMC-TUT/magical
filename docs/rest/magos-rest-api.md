# MAGOS REST API

A server responses are in JSON format








## Idea Tool (Crystal Ball)


**Notice**

*   Auth required for this API
*   Data is shown based on user's organization
*   Content updating is done through Django Admin pages

### Get Word Lists

#### Request

GET /v1/tools/crystalball/lists

#### Response

**Data**
[{ "first-list": "First List", "second-list": "Second List" }]

**Attributes**
*   slug
*   name

### Get Word List with Words

#### Request

GET /v1/tools/crystalball/lists/:name

*   :name List name in slug format

#### Response

**Data**

[{ "type": "verb", "word": "run" }, { "type": "adjective", "word": "yellow" }, { "type": "substantive", "word": "snow" }]

**Attributes**

*   type: [verb|substantive|adjective]
*   word


