
[Markdown Document Syntax](https://github.com/fletcher/MultiMarkdown/blob/master/Documentation/Markdown%20Syntax.md)


# MAGOS REST API

**Notice**

*   A server responses are in JSON format
*   Standard HTTP Status Codes are used as response codes (http://en.wikipedia.org/wiki/List_of_HTTP_status_codes)


* * *


## Idea Tool (Crystal Ball)

**Notice**

*   Auth required for this API
*   Data is shown based on user's organization
*   Content updating is done through Django Admin pages

### Get Word Lists

#### Request

GET /v1/tools/crystalball/lists

#### Response

    [
        {
            "first-list": "First List",
            "second-list": "Second List"
        }
    ]

**Attributes**
*   slug
*   name

### Get Word List with Words

#### Request

GET /v1/tools/crystalball/lists/:list

*   :list Name of the List in slug format

#### Response

    [
        {
            "type": "verb",
            "word": "run"
        },
        {
            "type": "adjective",
            "word": "yellow"
        },
        {
            "type": "substantive",
            "word": "snow"
        }
    ]

**Attributes**
*   type: verb|substantive|adjective
*   word


* * *


## Logging

**Notice**

*   Auth required for this API

### Add Log Entry

#### Request

POST /v1/logs/:log

*   :log editor|user|game (database table)

**Params**
*   type Event type
*   value Value for Event
*   game Game *identifier*. Mandatory for Game and Editor logs

**POHDITTAVAKSI & PÄÄTETTÄVÄKSI KUN KÄYTETÄÄN PELIN SLUG STRINGIÄ MUUTEN PELISSÄ YLEISESTI NIIN OLISI MAHDOLLISESTI PAREMPI KÄYTTÄÄ NYKYISESTÄ TIETOKANTA TAULUSTA POIKETEN PELIN SLUGIA ID:N SIJAAN TÄSSÄ**


* * *


## Portal

### Add Game Review

POST /v1/reviews

**Params**
*   game Game's slug
*   stars Value between 1-5
*   comment (optional)

### Update Game Review

PUT /v1/reviews/:game

*   :game Game's slug

**Params**
*   stars Value between 1-5
*   comment (optional)


* * *


## Editor



