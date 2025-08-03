# Getting Device Detail
Developers can obtain personal device details through Application Key and API Key.

Request to： https://api.ecowitt.net/api/v3/device/info

Return Data format： JSON

Request Type： GET

Example： https://api.ecowitt.net/api/v3/device/info?application_key=APPLICATION_KEY&api_key=API_KEY&mac=Your_MAC

## Request Parameters

| Parameter               | Type    | MANDATORY | Remark                                                                                                |
| ---                     | ---     | ---       | ---                                                                                                   |
| application_key         | String  | Yes       | obtained application key                                                                              |
| api_key                 | String  | Yes       | obtained api key                                                                                      |
| mac                     | String  | No        | Device MAC(eg.”FF:FF:FF:FF:FF:FF”;”mac” and “imei” can’t be null at same time)                        |
| imei                    | String  | No        | Device IMEI(eg.”863879049793071”;”mac” and “imei” can’t be null at same time)                         |
| temp_unitid             | Integer | No        | Temperature unit：（default）”2” for unit in ℉，”1” for unit in ℃                                         |
| pressure_unitid         | Integer | No        | Pressure unit：（default）”4” for inHg，”3” for hPa，”5” for mmHg                                          |
| wind_speed_unitid       | Integer | No        | Wind speed unit：（default）”9” for mph，”6” for m/s，”7” for km/h，”8” for knots，”10” for BFT，”11” for fpm |
| rainfall_unitid         | Integer | No        | Rain unit：（default）”13” for in，”12” for mm                                                            |
| solar_irradiance_unitid | Integer | No        | Solar Irradiance：（default）”16” for W/m²，”14” for lux，”15” for fc                                      |
| capacity_unitid         | Integer | No        | Capacity:(default)“24” for L，“25” for m³，“26” for gal                                                 |

## Response

See `device-info.json`
