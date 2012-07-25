
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
            "slug": "first-list",
            "name": "First List"
        },
        ...
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
        ...
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
*   comment (optional, max length 255 characters)


* * *


## Editor

### Get Images

#### Request

GET /v1/images

**Params**
*   type 0|1 (image|anim sprite) (optional)
*   limit (default 50)
*   offset (default 0)


**TIEDOSTOJEN TALLENNUSTAPA PÄÄTETTÄVÄ**

#### Response

    [
        {
            "name": "Big Stone",
            "slug": "big-stone",
            "type": 1,
            "state": 1,
            "file": "http://.." | Base64 endcoded string
        },
        ...
    ]

**Attributes**
*   name
*   slug
*   type
*   state
*   file

### Add Image

#### Request

POST /v1/images

**Params**
*   name Name of the Image
*   file Image file (file | encoded string)
*   type 0|1 (image|anim sprite)
*   state 0|1 (private|public)

### Update Image

#### Request

PUT /v1/images/:image

*   :image Image's slug

**Params**
*   state 0|1

### Get Audios

#### Request

GET /v1/audios

**Params**
*   limit (default 50)
*   offset (default 0)




