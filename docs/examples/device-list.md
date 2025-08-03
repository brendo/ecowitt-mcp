# Getting Device List
Device list can be acquired via Application Key, API key.

Request to： https://api.ecowitt.net/api/v3/device/list

Return Data format： JSON

Request Type： GET

Example： https://api.ecowitt.net/api/v3/device/list?application_key=APPLICATION_KEY&api_key=API_KEY

## Request Parameters

| Parameter       | type    | Mandatory | Remark                                |
| ---             | ---     | ---       | ---                                   |
| application_key | String  | Yes       | obtained application key              |
| api_key         | String  | Yes       | obtained api key                      |
| limit           | Integer | No        | Device number on the page（default：10） |
| page            | Integer | No        | Current page（default：1）               |

## Response

See `device-list.json`
