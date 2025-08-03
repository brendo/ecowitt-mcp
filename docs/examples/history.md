# Getting Device History Data

With Application Key, API Key, MAC/IMEI and time duration defined, the history data can be obtained with the following rules attached：

5 minutes resolution data within the past 90days, each data request time span should not be longer than a complete day；
30 minutes resolution data within the past 365days, each data request time span should not be longer than a complete week；
240 minutes resolution data within the past 730days, each data request time span should not be longer than a complete month；
24 hours resolution data within the past 1460days, each data request time span should not be longer than a complete year;
24 hours resolution data within the past 7days, each data request time span should not be longer than a complete day;
Request to： https://api.ecowitt.net/api/v3/device/history

Return Data format： JSON

Request Type： GET

Example： https://api.ecowitt.net/api/v3/device/history?application_key=APPLICATION_KEY&api_key=API_KEY&mac=YOUR_MAC_CODE_OF_DEVICE&start_date=2022-01-01 00:00:00&end_date=2022-01-01 23:59:59&cycle_type=auto&call_back=outdoor,indoor.humidity

## Request Parameters：

| Parameter               | Type    | Required | Description
| ---                     | ---     | ---      | ---                                                                                                                                                                             |
| application_key         | String  | Yes      | obtained application key                                                                                                                                                        |
| api_key                 | String  | Yes      | obtained api key                                                                                                                                                                |
| mac                     | String  | No       | Device MAC(eg.”FF:FF:FF:FF:FF:FF”;”mac” and “imei” can’t be null at same time)                                                                                                  |
| imei                    | String  | No       | Device IMEI(eg.”863879049793071”;”mac” and “imei” can’t be null at same time)                                                                                                   |
| start_date              | String  | Yes      | Start time of data query (including the given time point), format: ISO8601.                                                                                                     |
| end_date                | String  | Yes      | End time of data query (including the given time point), format: ISO8601.                                                                                                       |
| call_back               | String  | Yes      | Returned field types are supported, including: outdoor (outdoor group), camera (camera group), WFC01-0xxxxxx8 (Device Default Title，Sub-device group), and other field queries.|
| cycle_type              | String  | No       | Inquiry Data type : time span will automatically define data resolution applied for 5 minutes, 30 minutes 240minutes or 24hours(eg.”auto”,”5min”,”30min”,”4hour”,”1day”)        |
| temp_unitid             | Integer | No       | Temperature unit:(default)”2” for unit in ℉,”1” for unit in ℃                                                                                                                   |
| pressure_unitid         | Integer | No       | Pressure unit:(default)”4”for inHg,”3” for hPa,”5” for mmHg                                                                                                                     |
| wind_speed_unitid       | Integer | No       | Wind speed unit:(default)”9” for mph,”6” for m/s,”7” for km/h,”8” for knots,”10” for BFT,”11” for fpm                                                                           |
| rainfall_unitid         | Integer | No       | Rain unit:(default)”13” for in,”12” for mm                                                                                                                                      |
| solar_irradiance_unitid | Integer | No       | Solar Irradiance:(default)”16” for W/m²,”14” for lux,”15” for fc                                                                                                                |
| capacity_unitid         | Integer | No       | Capacity：（default）“24” for L，“25” for m³，“26” for gal                                                                                                                        |


## API Usage Instructions:

- application_key and api_key are required parameters for authentication.
- At least one of mac or imei parameters must be provided to identify the device.
- Time parameters must strictly follow the ISO8601 format (e.g., 2023-12-10 12:00:00).
- Choose the appropriate cycle_type based on the time range to optimize the query results.
- Use the call_back parameter to customize the returned data content. It supports specifying specific fields or device types. The parameter supports multi-field queries separated by commas, such as outdoor.temp,indoor.humidity or WFC01-0xxxxxx8.water_total.
- Set unit parameters as needed, such as temperature unit (temp_unitid) or wind speed unit (wind_speed_unitid).

## Response

See `history.json`
