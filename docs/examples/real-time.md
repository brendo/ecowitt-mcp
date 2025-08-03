# Getting Device Real-Time Data

Developer may obtain data within the past 2hrs via its application Key, API key, Mac/IMEI and meteorological data. Or the latest data of camera within 24hrs.

Request to： https://api.ecowitt.net/api/v3/device/real_time

Return Data format： JSON

Request Type： GET

Example： https://api.ecowitt.net/api/v3/device/real_time?application_key=APPLICATION_KEY&api_key=API_KEY&mac=YOUR_MAC_CODE_OF_DEVICE&call_back=all

> Interface note： The real-time data of meteorological equipment, camera equipment, and sub-devices are obtained by querying the application key of the calling interface, the key of the calling interface, and the MAC/IMEI identification code of the equipment.

## Request Parameters：

| Parameter                                                                                                                      | Type     | Required | Description                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------ | -------- | -------- | --------------------------------------------------------------------------------------------- |
| application_key                                                                                                                | String   | Yes      | obtained application key                                                                      |
| api_key                                                                                                                        | String   | Yes      | obtained api key                                                                              |
| mac                                                                                                                            | String   | No       | Device MAC(eg.”FF:FF:FF:FF:FF:FF”;”mac” and “imei” can’t be null at same time)                |
| imei                                                                                                                           | String   | No       | Device IMEI(eg.”863879049793071”;”mac” and “imei” can’t be null at same time)                 |
| call_back                                                                                                                      | String   | No       | The supported returned field types include: outdoor (outdoor group), camera (camera group), WFC01-0xxxxxx8 (Default Title, Sub-device group), and other field queries. |
| temp_unitid                                                                                                                    | Integer  | No       | Temperature unit:(default)”2” for unit in ℉,”1” for unit in ℃                                 |
| pressure_unitid                                                                                                                | Integer  | No       | Pressure unit:(default)”4” for inHg,”3” for hPa,”5” for mmHg                                  |
| wind_speed_unitid                                                                                                              | Integer  | No       | Wind speed unit:(default)”9” for mph,”6” for m/s,”7” for km/h,”8” for knots,”10” for BFT,”11” for fpm |
| rainfall_unitid                                                                                                                | Integer  | No       | Rain unit:(default)”13” for in,”12” for mm                                                    |
| solar_irradiance_unitid                                                                                                        | Integer  | No       | Solar Irradiance:(default)”16” for W/m²,”14” for lux,”15” for fc                              |
| capacity_unitid                                                                                                                | Integer  | No       | Capacity:(default)“24” for L，“25” for m³，“26” for gal                                       |

## API Usage Instructions:

- application_key and api_key are mandatory parameters for authentication.
- At least one of the mac or imei parameters must be provided to identify the device.
- Use the call_back parameter to customize the content of the returned data. It allows specifying specific fields or device types. Multiple field queries can be included, separated by commas, such as outdoor.temp, indoor.humidity, or WFC01-0xxxxxx8.daily.
- Set unit parameters as needed, such as the temperature unit (temp_unitid) or wind speed unit (wind_speed_unitid).

## Response

See `real-time.json`
