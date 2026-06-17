# Gridlock Dataset Profile

Generated: 2026-06-17 09:09:38 UTC

This report profiles the raw datasets for Phase 1 cleaning. No data was modified.

## ml/data/raw/events.csv Dataset

- File: ml/data/raw/events.csv

- Dimensions: 8173 rows × 46 columns

- Memory usage: 16.10 MB


### Column Names

id, event_type, latitude, longitude, endlatitude, endlongitude, address, end_address, event_cause, requires_road_closure, start_datetime, end_datetime, status, authenticated, modified_datetime, map_file, direction, description, veh_type, veh_no, corridor, priority, cargo_material, reason_breakdown, age_of_truck, created_date, route_path, client_id, created_by_id, last_modified_by_id, assigned_to_police_id, citizen_accident_id, comment, police_station, meta_data, kgid, resolved_at_address, resolved_at_latitude, resolved_at_longitude, closed_by_id, closed_datetime, resolved_by_id, resolved_datetime, gba_identifier, zone, junction

### Dtypes

id object
event_type object
latitude float64
longitude float64
endlatitude float64
endlongitude float64
address object
end_address object
event_cause object
requires_road_closure bool
start_datetime object
end_datetime object
status object
authenticated object
modified_datetime object
map_file float64
direction object
description object
veh_type object
veh_no object
corridor object
priority object
cargo_material object
reason_breakdown object
age_of_truck float64
created_date object
route_path object
client_id int64
created_by_id object
last_modified_by_id object
assigned_to_police_id object
citizen_accident_id object
comment float64
police_station object
meta_data float64
kgid object
resolved_at_address object
resolved_at_latitude float64
resolved_at_longitude float64
closed_by_id object
closed_datetime object
resolved_by_id object
resolved_datetime object
gba_identifier object
zone object
junction object

### Missing Value Summary

| column | missing | missing_pct | empty_string | literal_null_text | non_null |
| --- | --- | --- | --- | --- | --- |
| id | 0 | 0.0% | 0 | 0 | 8173 |
| event_type | 0 | 0.0% | 0 | 0 | 8173 |
| latitude | 0 | 0.0% | 0 | 0 | 8173 |
| longitude | 0 | 0.0% | 0 | 0 | 8173 |
| endlatitude | 169 | 2.1% | 0 | 0 | 8004 |
| endlongitude | 169 | 2.1% | 0 | 0 | 8004 |
| address | 3 | 0.0% | 0 | 0 | 8170 |
| end_address | 7486 | 91.6% | 0 | 0 | 687 |
| event_cause | 0 | 0.0% | 0 | 0 | 8173 |
| requires_road_closure | 0 | 0.0% | 0 | 0 | 8173 |
| start_datetime | 0 | 0.0% | 0 | 0 | 8173 |
| end_datetime | 7683 | 94.0% | 0 | 0 | 490 |
| status | 0 | 0.0% | 0 | 0 | 8173 |
| authenticated | 0 | 0.0% | 0 | 0 | 8173 |
| modified_datetime | 0 | 0.0% | 0 | 0 | 8173 |
| map_file | 8173 | 100.0% | 0 | 0 | 0 |
| direction | 8130 | 99.5% | 0 | 0 | 43 |
| description | 1360 | 16.6% | 0 | 0 | 6813 |
| veh_type | 3286 | 40.2% | 0 | 0 | 4887 |
| veh_no | 3287 | 40.2% | 0 | 0 | 4886 |
| corridor | 20 | 0.2% | 0 | 0 | 8153 |
| priority | 2 | 0.0% | 0 | 0 | 8171 |
| cargo_material | 7897 | 96.6% | 0 | 0 | 276 |
| reason_breakdown | 7897 | 96.6% | 0 | 0 | 276 |
| age_of_truck | 7897 | 96.6% | 0 | 0 | 276 |
| created_date | 0 | 0.0% | 0 | 0 | 8173 |
| route_path | 8036 | 98.3% | 0 | 0 | 137 |
| client_id | 0 | 0.0% | 0 | 0 | 8173 |
| created_by_id | 2 | 0.0% | 0 | 0 | 8171 |
| last_modified_by_id | 3 | 0.0% | 0 | 0 | 8170 |
| assigned_to_police_id | 8045 | 98.4% | 0 | 0 | 128 |
| citizen_accident_id | 8045 | 98.4% | 0 | 0 | 128 |
| comment | 8173 | 100.0% | 0 | 0 | 0 |
| police_station | 0 | 0.0% | 0 | 0 | 8173 |
| meta_data | 8173 | 100.0% | 0 | 0 | 0 |
| kgid | 259 | 3.2% | 0 | 0 | 7914 |
| resolved_at_address | 8099 | 99.1% | 0 | 0 | 74 |
| resolved_at_latitude | 8099 | 99.1% | 0 | 0 | 74 |
| resolved_at_longitude | 8099 | 99.1% | 0 | 0 | 74 |
| closed_by_id | 5032 | 61.6% | 0 | 0 | 3141 |
| closed_datetime | 5032 | 61.6% | 0 | 0 | 3141 |
| resolved_by_id | 8099 | 99.1% | 0 | 0 | 74 |
| resolved_datetime | 8099 | 99.1% | 0 | 0 | 74 |
| gba_identifier | 4729 | 57.9% | 0 | 0 | 3444 |
| zone | 4729 | 57.9% | 0 | 0 | 3444 |
| junction | 5663 | 69.3% | 0 | 0 | 2510 |

### Auto-Identified Column Groups

- Id Columns: assigned_to_police_id, citizen_accident_id, client_id, closed_by_id, created_by_id, created_date, id, last_modified_by_id, latitude, longitude, modified_datetime, resolved_by_id, start_datetime
- Datetime Columns: closed_datetime, created_date, end_datetime, modified_datetime, resolved_datetime, start_datetime
- Latitude Columns: endlatitude, latitude, resolved_at_latitude
- Longitude Columns: endlongitude, longitude, resolved_at_longitude
- Event Type Columns: event_type, event_cause, veh_type, reason_breakdown
- Status Columns: status
- Priority Columns: priority
- Zone Junction Location Columns: address, end_address, corridor, police_station, resolved_at_address, zone, junction

### Column Descriptions

#### id

- dtype: object
- non-null: 8173
- unique: 8173
top values:
 - FKID000000: 1
 - FKID005444: 1
 - FKID005457: 1
 - FKID005456: 1
 - FKID005455: 1


#### event_type

- dtype: object
- non-null: 8173
- unique: 2
top values:
 - unplanned: 7706
 - planned: 467


#### latitude

- dtype: float64
- non-null: 8173
- unique: 8014
top values:
 - 12.91861725: 53
 - 12.9311998: 8
 - 13.026353: 5
 - 13.0264: 4
 - 12.97492981: 4


#### longitude

- dtype: float64
- non-null: 8173
- unique: 7993
top values:
 - 77.58946: 53
 - 77.6868948: 8
 - 77.5839711: 8
 - 77.544093: 5
 - 77.5682358: 4


#### endlatitude

- dtype: float64
- non-null: 8004
- unique: 685
top values:
 - 0.0: 7315
 - 12.90644027: 2
 - 12.9806594: 2
 - 12.98758493: 2
 - 13.0394567: 2


#### endlongitude

- dtype: float64
- non-null: 8004
- unique: 685
top values:
 - 0.0: 7315
 - 77.5700018: 2
 - 77.57230719: 2
 - 77.57317543: 2
 - 77.6028361: 2


#### address

- dtype: object
- non-null: 8170
- unique: 3089
top values:
 - Outer Ring Road, Karthik Nagar, Marathahalli, Bengaluru, Karnataka. Pin-560037 (India): 88
 - 2nd Cross Road, MTB Area, Jayanagar, Bengaluru, Karnataka. Pin-560041 (India): 44
 - Sankey Road, RV Layout, Seshadripuram, Bengaluru, Karnataka. Pin-560020 (India): 36
 - MBT Road, Block 5 Stage 1, HBR Layout, Bengaluru, Karnataka. Pin-560043 (India): 35
 - Sankey Road, MD Nanjundaswamy Circle, Rajamahal Guttahalli, Bengaluru, Karnataka. Pin-560003 (India): 34


#### end_address

- dtype: object
- non-null: 687
- unique: 561
top values:
 - Varthuru Road, Deja View Homes, Nagavara Palya, CV Raman Nagar, Bengaluru, Karnataka. Pin-560093 (India): 6
 - Outer Ring Road, CQAE Staff Quarters, Yeshwanthpur, Bengaluru, Karnataka. Pin-560022 (India): 6
 - Kankanagar Main Road, Lawrence Layout, Nagavara, Bengaluru, Karnataka. Pin-560045 (India): 4
 - MBT Road, Zero Tolerance Junction, KR Puram, Bengaluru, Karnataka. Pin-560049 (India): 4
 - Cubbon Park Road, Krishna Rajendra Circle, Gandhi Nagar, Bengaluru, Karnataka. Pin-560001 (India): 4


#### event_cause

- dtype: object
- non-null: 8173
- unique: 17
top values:
 - vehicle_breakdown: 4896
 - others: 638
 - pot_holes: 537
 - construction: 480
 - water_logging: 458


#### requires_road_closure

- dtype: bool
- non-null: 8173
- unique: 2
top values:
 - False: 7497
 - True: 676


#### start_datetime

- dtype: object
- non-null: 8173
- unique: 8060
top values:
 - 2024-01-16 23:18:15.118206+00: 52
 - 2024-03-17 22:05:46+00: 15
 - 2024-04-06 08:13:39.437+00: 8
 - 2023-11-12 10:00:46.584+00: 3
 - 2024-01-19 12:05:46+00: 3


#### end_datetime

- dtype: object
- non-null: 490
- unique: 459
top values:
 - 2024-03-18 03:05:46+00: 9
 - 2024-03-03 20:05:46+00: 5
 - 2024-01-22 11:35:46+00: 4
 - 2024-02-19 07:05:46+00: 3
 - 2024-01-07 22:05:46+00: 2


#### status

- dtype: object
- non-null: 8173
- unique: 3
top values:
 - closed: 7095
 - active: 1007
 - resolved: 71


#### authenticated

- dtype: object
- non-null: 8173
- unique: 2
top values:
 - yes: 7166
 - no: 1007


#### modified_datetime

- dtype: object
- non-null: 8173
- unique: 8173
top values:
 - 2024-03-07 19:35:47.871698+00: 1
 - 2024-03-21 21:07:43.940877+00: 1
 - 2023-12-23 09:35:47.75249+00: 1
 - 2023-12-22 20:53:24.909681+00: 1
 - 2023-12-22 22:35:48.110382+00: 1


#### map_file

- dtype: float64
- non-null: 0
- unique: 0
top values:


#### direction

- dtype: object
- non-null: 43
- unique: 8
top values:
 - south_west: 12
 - north_west: 10
 - west: 8
 - south: 7
 - north: 2


#### description

- dtype: object
- non-null: 6813
- unique: 5542
top values:
 - Starting problem: 80
 - starting problem: 58
 - [PERSON]: 42
 - Vehicle breakdown: 29
 - Vehicle break down: 28


#### veh_type

- dtype: object
- non-null: 4887
- unique: 10
top values:
 - bmtc_bus: 1466
 - heavy_vehicle: 965
 - lcv: 678
 - others: 449
 - private_bus: 359


#### veh_no

- dtype: object
- non-null: 4886
- unique: 4212
top values:
 - FKN00GL0784: 7
 - FKN00GL2302: 5
 - FKN00GL0740: 5
 - FKN00GL1676: 5
 - FKN00GL3436: 4


#### corridor

- dtype: object
- non-null: 8153
- unique: 22
top values:
 - Non-corridor: 3124
 - Mysore Road: 743
 - Bellary Road 1: 610
 - Tumkur Road: 458
 - Bellary Road 2: 379


#### priority

- dtype: object
- non-null: 8171
- unique: 2
top values:
 - High: 5030
 - Low: 3141


#### cargo_material

- dtype: object
- non-null: 276
- unique: 138
top values:
 - Goods: 23
 - goods: 20
 - Goods carried: 18
 - goods carried: 13
 - Yes: 11


#### reason_breakdown

- dtype: object
- non-null: 276
- unique: 193
top values:
 - Starting problem: 22
 - starting problem: 11
 - Breakdown: 8
 - breakdown: 6
 - break down: 5


#### age_of_truck

- dtype: float64
- non-null: 276
- unique: 47
top values:
 - 10.0: 66
 - 5.0: 33
 - 8.0: 22
 - 15.0: 15
 - 12.0: 12


#### created_date

- dtype: object
- non-null: 8173
- unique: 8172
top values:
 - 2023-06-29 04:05:46+00: 2
 - 2024-03-07 17:03:51.164032+00: 1
 - 2023-12-22 22:15:05.65869+00: 1
 - 2023-12-22 21:00:24.393788+00: 1
 - 2023-12-22 20:30:07.158754+00: 1


#### route_path

- dtype: object
- non-null: 137
- unique: 83
top values:
 - []: 51
 - [[12.985061030406605,77.57213473320009],[12.985227448601922,77.57209718227388],[12.985687067800164,77.57217764854433],[12.98619891545208,77.5721722841263],[12.98724349922482,77.57218301296236],[12.988120946199613,77.5721722841263],[12.988648457472479,77.57205963134766],[12.989259533487099,77.57191479206087],[12.989560594898055,77.57189333438875]]: 2
 - [[12.917474379925421,77.57394790649415],[12.916956686174556,77.57360458374025],[12.915760711773572,77.57356166839601],[12.914465055561982,77.57343292236328],[12.913712735968987,77.57334709167482],[12.912542456544706,77.57300376892091],[12.91170653931503,77.57283210754396],[12.910745231044606,77.5728750228882],[12.910034696468443,77.57291793823244],[12.908906196225654,77.57296085357667],[12.90800771195786,77.57303595542909],[12.907328517100298,77.57314324378969],[12.906440265131732,77.57317543029787]]: 2
 - [[12.988724579319346,77.57410490641826],[12.98874026251143,77.57414783687544],[12.988301132759055,77.57422833148267],[12.987893368722464,77.57430882608988],[12.987752219476935,77.57421759886837],[12.987726080718938,77.57398684766096],[12.987673803194753,77.57366486923205],[12.98766334768861,77.57344485063898],[12.987647664428549,77.57322483204587],[12.987652892181996,77.5730960406743],[12.987631981167484,77.57293505145982],[12.987611070151193,77.57265600348815],[12.987590159133143,77.57251111319509],[12.987584931378374,77.57233939136634],[12.987584931378374,77.57230719352347]]: 2
 - ": 2


#### client_id

- dtype: int64
- non-null: 8173
- unique: 2
top values:
 - 1: 8093
 - 2: 80


#### created_by_id

- dtype: object
- non-null: 8171
- unique: 1898
top values:
 - FKUSR00105: 104
 - FKUSR00043: 101
 - FKUSR00009: 80
 - FKUSR00402: 62
 - FKUSR00026: 57


#### last_modified_by_id

- dtype: object
- non-null: 8170
- unique: 304
top values:
 - FKUSR00001: 7091
 - FKUSR00009: 553
 - FKUSR01441: 52
 - FKUSR00026: 38
 - FKUSR00361: 28


#### assigned_to_police_id

- dtype: object
- non-null: 128
- unique: 62
top values:
 - FKUSR01441: 52
 - FKUSR00292: 4
 - FKUSR01429: 3
 - FKUSR01540: 3
 - FKUSR00599: 3


#### citizen_accident_id

- dtype: object
- non-null: 128
- unique: 77
top values:
 - FKUSR01442: 52
 - FKUSR00006: 1
 - FKUSR01637: 1
 - FKUSR01636: 1
 - FKUSR01618: 1


#### comment

- dtype: float64
- non-null: 0
- unique: 0
top values:


#### police_station

- dtype: object
- non-null: 8173
- unique: 54
top values:
 - Yelahanka: 377
 - HAL Old Airport: 361
 - Sadashivanagar: 302
 - Halasuru Gate: 297
 - Byatarayanapura: 297


#### meta_data

- dtype: float64
- non-null: 0
- unique: 0
top values:


#### kgid

- dtype: object
- non-null: 7914
- unique: 1853
top values:
 - FKKG000099: 104
 - FKKG000037: 100
 - FKKG000392: 62
 - FKKG000022: 57
 - FKKG000429: 52


#### resolved_at_address

- dtype: object
- non-null: 74
- unique: 58
top values:
 - Yeshwanthpura TTMC Bus Stand Road, Salarpuria Satva Luxuria, Malleshwaram West, Bengaluru, Karnataka. Pin-560055 (India): 8
 - Yeshwanthpura TTMC Bus Stand Road, Yeshwanthapura Circle, Yeshwanthpur, Bengaluru, Karnataka. Pin-560022 (India): 4
 - Unnamed Road, Kempegowda Layout, Adiganahalli, Bengaluru, Karnataka. Pin-560064 (India): 2
 - 2nd Main Road, Maleshwaramma Nagar, T Dasarahalli, Bengaluru, Karnataka. Pin-560057 (India): 2
 - Dhananayakanahalli Main Road, Ramasandra South Taluka, Bengaluru, Karnataka. Pin-560060 (India): 2


#### resolved_at_latitude

- dtype: float64
- non-null: 74
- unique: 74
top values:
 - 12.9218755: 1
 - 12.9437231: 1
 - 13.0185251: 1
 - 12.9657332: 1
 - 12.989235: 1


#### resolved_at_longitude

- dtype: float64
- non-null: 74
- unique: 74
top values:
 - 77.6451585: 1
 - 77.5679238: 1
 - 77.555344: 1
 - 77.5747475: 1
 - 77.5503267: 1


#### closed_by_id

- dtype: object
- non-null: 3141
- unique: 1225
top values:
 - FKUSR00105: 54
 - FKUSR00402: 27
 - FKUSR00470: 18
 - FKUSR00458: 18
 - FKUSR00440: 17


#### closed_datetime

- dtype: object
- non-null: 3141
- unique: 3141
top values:
 - 2024-01-30 04:56:03.281509+00: 1
 - 2023-12-23 04:19:56.47055+00: 1
 - 2023-12-23 05:58:20.256648+00: 1
 - 2023-12-23 08:10:33.419556+00: 1
 - 2023-12-23 19:26:54.708418+00: 1


#### resolved_by_id

- dtype: object
- non-null: 74
- unique: 42
top values:
 - FKUSR01665: 8
 - FKUSR00639: 6
 - FKUSR00169: 4
 - FKUSR00408: 4
 - FKUSR00648: 4


#### resolved_datetime

- dtype: object
- non-null: 74
- unique: 74
top values:
 - 2024-01-30 04:17:46.828355+00: 1
 - 2023-12-06 05:58:29.601766+00: 1
 - 2023-12-04 08:06:10.899388+00: 1
 - 2023-12-02 21:00:03.902984+00: 1
 - 2023-11-29 00:25:39.014309+00: 1


#### gba_identifier

- dtype: object
- non-null: 3444
- unique: 5
top values:
 - Bengaluru Central Corporation: 892
 - Bengaluru West Corporation: 791
 - Bengaluru North Corporation: 731
 - Bengaluru South Corporation: 587
 - Bengaluru East Corporation: 443


#### zone

- dtype: object
- non-null: 3444
- unique: 10
top values:
 - Central Zone 2: 623
 - West Zone 1: 433
 - North Zone 2: 413
 - West Zone 2: 358
 - South Zone 2: 354


#### junction

- dtype: object
- non-null: 2510
- unique: 294
top values:
 - MekhriCircle: 64
 - AyyappaTempleJunc: 49
 - SatteliteBusStandJunc: 43
 - YeshwanthpuraCircle: 38
 - YelhankaCircle: 34



### First 5 Rows

        id event_type  latitude  longitude  endlatitude  endlongitude                                                                                                address                                                                                  end_address       event_cause  requires_road_closure             start_datetime end_datetime   status authenticated             modified_datetime  map_file direction                                                                                                           description      veh_type      veh_no     corridor priority cargo_material reason_breakdown  age_of_truck                  created_date route_path  client_id created_by_id last_modified_by_id assigned_to_police_id citizen_accident_id  comment police_station  meta_data       kgid                                                                         resolved_at_address  resolved_at_latitude  resolved_at_longitude closed_by_id               closed_datetime resolved_by_id             resolved_datetime                gba_identifier           zone            junction
FKID000000  unplanned 13.040004  77.518099     0.000000      0.000000   Mumbai Bengaluru Highway, Jalahalli Cross Junction, Peenya, Bengaluru, Karnataka. Pin-560058 (India)                                                                                          NaN vehicle_breakdown                  False 2024-03-07 17:01:48.111+00          NaN   closed           yes 2024-03-07 19:35:47.871698+00       NaN       NaN                                                                                       s m circle in coming  man track           lcv FKN00GL0000  Tumkur Road     High            NaN              NaN           NaN 2024-03-07 17:03:51.164032+00        NaN          1    FKUSR00000          FKUSR00001                   NaN                 NaN      NaN         Peenya        NaN FKKG000000                                                                                         NaN                   NaN                    NaN          NaN                           NaN            NaN                           NaN                           NaN            NaN                 NaN
FKID000001  unplanned 12.921876  77.645158     0.000000      0.000000            19th Main Road, Heavie Halcyon, Agara, HSR Layout, Bengaluru, Karnataka. Pin-560102 (India)                                                                                          NaN vehicle_breakdown                  False 2024-01-30 04:07:24.173+00          NaN resolved           yes 2024-01-30 04:17:46.828979+00       NaN       NaN                                                                                                      Starting problem heavy_vehicle FKN00GL0001   ORR East 1     High            NaN              NaN           NaN 2024-01-30 04:08:22.954979+00        NaN          1    FKUSR00002          FKUSR00001                   NaN                 NaN      NaN     HSR Layout        NaN FKKG000001 19th Main Road, Heavie Halcyon, Agara, HSR Layout, Bengaluru, Karnataka. Pin-560102 (India)             12.921876              77.645158          NaN                           NaN     FKUSR00002 2024-01-30 04:17:46.828355+00                           NaN            NaN                 NaN
FKID000002  unplanned 12.955622  77.585708     0.000000      0.000000  Lalbagh Main Road, Dr Sri Shantaveera Swami Circle, Mavalli, Bengaluru, Karnataka. Pin-560004 (India)                                                                                          NaN            others                  False 2023-11-11 06:18:03.343+00          NaN   closed           yes 2024-01-30 04:56:03.282003+00       NaN       NaN ಊರ್ವಶಿ ಜಂಕ್ಷನ್ ನಲ್ಲಿ ಒಳಚರಂಡಿ ಚೇಂಬರ್ ಗೆ ಹೊಸದಾಗಿ ಸಿಮೆಂಟ್ ಹಾಕಿದ್ದು ಟ್ರಾಫಿಕ್ ಮೂವ್ಮೆಂಟ್ ಸ್ವಲ್ಪ ನಿಧಾನಗತಿಯಲ್ಲಿ ಇರುತ್ತದೆ ಸರ್🙏           NaN         NaN Non-corridor      Low            NaN              NaN           NaN 2023-11-11 06:20:00.989398+00        NaN          1    FKUSR00003          FKUSR00001                   NaN                 NaN      NaN  Wilson Garden        NaN FKKG000002                                                                                         NaN                   NaN                    NaN   FKUSR00003 2024-01-30 04:56:03.281509+00            NaN                           NaN Bengaluru Central Corporation Central Zone 2     UrvashiJunction
FKID000003  unplanned 13.006147  77.579435    13.006239     77.579516                 Sankey Road, Bashyam Circle, Sadashiva Nagar, Bengaluru, Karnataka. Pin-560080 (India) Sankey Road, Palace Orchard Upper, Sadashiva Nagar, Bengaluru, Karnataka. Pin-560080 (India)         tree_fall                   True 2024-03-07 17:56:55.061+00          NaN   closed           yes  2024-03-14 07:42:05.55005+00       NaN       NaN                                                                                                             tree fall           NaN         NaN Non-corridor      Low            NaN              NaN           NaN 2024-03-07 17:58:56.696892+00        NaN          1    FKUSR00004          FKUSR00001                   NaN                 NaN      NaN Sadashivanagar        NaN FKKG000003                                                                                         NaN                   NaN                    NaN   FKUSR00004  2024-03-14 07:42:05.54944+00            NaN                           NaN                           NaN            NaN                 NaN
FKID000004  unplanned 12.953980  77.585233     0.000000      0.000000 Lalbagh Fort Road, Lalbagh Main Gate Junction, Wilson Garden, Bengaluru, Karnataka. Pin-560027 (India)                                                                                          NaN vehicle_breakdown                  False 2024-01-30 04:56:32.348+00          NaN   closed           yes  2024-01-30 05:35:17.33908+00       NaN       NaN                                                                      [LOCATION] ಪೈಪ್ [PERSON] ವಾಹನ ಆಫ್ ಆಗಿರುತ್ತದೆ ಸರ್   private_bus FKN00GL0002 Non-corridor      Low            NaN              NaN           NaN 2024-01-30 04:58:55.937662+00        NaN          1    FKUSR00003          FKUSR00001                   NaN                 NaN      NaN  Wilson Garden        NaN FKKG000002                                                                                         NaN                   NaN                    NaN   FKUSR00003 2024-01-30 05:35:17.338283+00            NaN                           NaN                           NaN            NaN LalbaghMainGateJunc


## ml/data/raw/violations.csv Dataset

- File: ml/data/raw/violations.csv

- Dimensions: 298450 rows × 24 columns

- Memory usage: 353.41 MB


### Column Names

id, latitude, longitude, location, vehicle_number, vehicle_type, description, violation_type, offence_code, created_datetime, closed_datetime, modified_datetime, device_id, created_by_id, center_code, police_station, data_sent_to_scita, junction_name, action_taken_timestamp, data_sent_to_scita_timestamp, updated_vehicle_number, updated_vehicle_type, validation_status, validation_timestamp

### Dtypes

id object
latitude float64
longitude float64
location object
vehicle_number object
vehicle_type object
description float64
violation_type object
offence_code object
created_datetime object
closed_datetime float64
modified_datetime object
device_id object
created_by_id object
center_code float64
police_station object
data_sent_to_scita bool
junction_name object
action_taken_timestamp float64
data_sent_to_scita_timestamp object
updated_vehicle_number object
updated_vehicle_type object
validation_status object
validation_timestamp object

### Missing Value Summary

| column | missing | missing_pct | empty_string | literal_null_text | non_null |
| --- | --- | --- | --- | --- | --- |
| id | 0 | 0.0% | 0 | 0 | 298450 |
| latitude | 0 | 0.0% | 0 | 0 | 298450 |
| longitude | 0 | 0.0% | 0 | 0 | 298450 |
| location | 3041 | 1.0% | 0 | 0 | 295409 |
| vehicle_number | 0 | 0.0% | 0 | 0 | 298450 |
| vehicle_type | 0 | 0.0% | 0 | 0 | 298450 |
| description | 298450 | 100.0% | 0 | 0 | 0 |
| violation_type | 0 | 0.0% | 0 | 0 | 298450 |
| offence_code | 0 | 0.0% | 0 | 0 | 298450 |
| created_datetime | 0 | 0.0% | 0 | 0 | 298450 |
| closed_datetime | 298450 | 100.0% | 0 | 0 | 0 |
| modified_datetime | 0 | 0.0% | 0 | 0 | 298450 |
| device_id | 0 | 0.0% | 0 | 0 | 298450 |
| created_by_id | 5 | 0.0% | 0 | 0 | 298445 |
| center_code | 11260 | 3.8% | 0 | 0 | 287190 |
| police_station | 5 | 0.0% | 0 | 0 | 298445 |
| data_sent_to_scita | 0 | 0.0% | 0 | 0 | 298450 |
| junction_name | 5 | 0.0% | 0 | 0 | 298445 |
| action_taken_timestamp | 298450 | 100.0% | 0 | 0 | 0 |
| data_sent_to_scita_timestamp | 256289 | 85.9% | 0 | 0 | 42161 |
| updated_vehicle_number | 125254 | 42.0% | 0 | 0 | 173196 |
| updated_vehicle_type | 125254 | 42.0% | 0 | 0 | 173196 |
| validation_status | 125254 | 42.0% | 0 | 0 | 173196 |
| validation_timestamp | 125254 | 42.0% | 0 | 0 | 173196 |

### Auto-Identified Column Groups

- Id Columns: created_by_id, device_id, id, modified_datetime
- Datetime Columns: action_taken_timestamp, closed_datetime, created_datetime, data_sent_to_scita_timestamp, modified_datetime, updated_vehicle_number, updated_vehicle_type, validation_timestamp
- Latitude Columns: latitude
- Longitude Columns: longitude
- Event Type Columns: vehicle_type, violation_type, updated_vehicle_type
- Status Columns: validation_status
- Priority Columns: none detected
- Zone Junction Location Columns: location, police_station, junction_name

### Column Descriptions

#### id

- dtype: object
- non-null: 298450
- unique: 298450
top values:
 - FKID000000: 1
 - FKID198991: 1
 - FKID198971: 1
 - FKID198970: 1
 - FKID198969: 1


#### latitude

- dtype: float64
- non-null: 298450
- unique: 177982
top values:
 - 12.9994571: 119
 - 12.8762932: 97
 - 12.934068071777288: 82
 - 12.9991769: 80
 - 12.9991039: 67


#### longitude

- dtype: float64
- non-null: 298450
- unique: 177378
top values:
 - 77.5495821: 199
 - 77.6806338: 103
 - 77.5965301: 97
 - 77.68976915672452: 82
 - 77.5775239: 80


#### location

- dtype: object
- non-null: 295409
- unique: 10942
top values:
 - Unnamed Road, Begur Chikkanahalli, Bengaluru, Karnataka. Pin-562149 (India): 4090
 - Kamaraj Road, Sri Nagamma Devi Circle, Sivanchetti Gardens, Bengaluru, Karnataka. Pin-560042 (India): 3999
 - New Horizon College Road, New Horizon College of Engineering, Kadubisanahalli, Bengaluru, Karnataka. Pin-560103 (India): 3785
 - MBT Road, Devasandra Junction, KR Puram, Bengaluru, Karnataka. Pin-560036 (India): 3027
 - Dispensary Road, Tasker Town, Shivaji Nagar, Bengaluru, Karnataka. Pin-560001 (India): 2670


#### vehicle_number

- dtype: object
- non-null: 298450
- unique: 231890
top values:
 - FKN00GL4424: 55
 - FKN00GL3514: 42
 - FKN00GL17863: 41
 - FKN00GL9771: 41
 - FKN00GL2906: 35


#### vehicle_type

- dtype: object
- non-null: 298450
- unique: 22
top values:
 - SCOOTER: 94856
 - CAR: 88870
 - MOTOR CYCLE: 40811
 - PASSENGER AUTO: 37813
 - MAXI-CAB: 11372


#### description

- dtype: float64
- non-null: 0
- unique: 0
top values:


#### violation_type

- dtype: object
- non-null: 298450
- unique: 991
top values:
 - ["WRONG PARKING"]: 138764
 - ["NO PARKING"]: 119576
 - ["PARKING IN A MAIN ROAD","WRONG PARKING"]: 9472
 - ["PARKING IN A MAIN ROAD","NO PARKING"]: 4818
 - ["WRONG PARKING","DEFECTIVE NUMBER PLATE"]: 3317


#### offence_code

- dtype: object
- non-null: 298450
- unique: 991
top values:
 - [112]: 138764
 - [113]: 119576
 - [107,112]: 9472
 - [107,113]: 4818
 - [112,116]: 3317


#### created_datetime

- dtype: object
- non-null: 298450
- unique: 94417
top values:
 - 2024-02-28 22:14:46+00: 61
 - 2024-03-13 00:57:46+00: 48
 - 2024-03-13 00:58:46+00: 45
 - 2023-11-18 00:55:46+00: 40
 - 2023-12-04 01:46:46+00: 37


#### closed_datetime

- dtype: float64
- non-null: 0
- unique: 0
top values:


#### modified_datetime

- dtype: object
- non-null: 298450
- unique: 298450
top values:
 - 2023-11-28 04:48:04.582978+00: 1
 - 2023-12-22 06:44:08.250586+00: 1
 - 2023-12-21 22:32:51.649031+00: 1
 - 2023-12-22 00:43:01.875611+00: 1
 - 2023-12-22 00:36:18.894181+00: 1


#### device_id

- dtype: object
- non-null: 298450
- unique: 3070
top values:
 - FKDEV00021: 4344
 - FKDEV00082: 2268
 - FKDEV00077: 2156
 - FKDEV00023: 2145
 - FKDEV00075: 2095


#### created_by_id

- dtype: object
- non-null: 298445
- unique: 2666
top values:
 - FKUSR00021: 4099
 - FKUSR00332: 3467
 - FKUSR00082: 2268
 - FKUSR00077: 2175
 - FKUSR00023: 2145


#### center_code

- dtype: float64
- non-null: 287190
- unique: 52
top values:
 - 3.0: 34468
 - 16.0: 28044
 - 19.0: 22200
 - 13.0: 20819
 - 28.0: 17646


#### police_station

- dtype: object
- non-null: 298445
- unique: 54
top values:
 - Upparpet: 34468
 - Shivajinagar: 28044
 - Malleshwaram: 22200
 - HAL Old Airport: 20819
 - City Market: 17646


#### data_sent_to_scita

- dtype: bool
- non-null: 298450
- unique: 2
top values:
 - True: 255893
 - False: 42557


#### junction_name

- dtype: object
- non-null: 298445
- unique: 169
top values:
 - No Junction: 147880
 - BTP051 - Safina Plaza Junction: 15449
 - BTP082 - KR Market Junction: 11538
 - BTP040 - Elite Junction: 10718
 - BTP044 - Sagar Theatre Junction: 10549


#### action_taken_timestamp

- dtype: float64
- non-null: 0
- unique: 0
top values:


#### data_sent_to_scita_timestamp

- dtype: object
- non-null: 42161
- unique: 42161
top values:
 - 2024-04-01 17:45:48.438875+00: 1
 - 2024-04-12 19:39:05.149+00: 1
 - 2024-04-12 19:39:05.191319+00: 1
 - 2024-04-12 19:39:53.607001+00: 1
 - 2024-04-12 19:39:53.61298+00: 1


#### updated_vehicle_number

- dtype: object
- non-null: 173196
- unique: 143133
top values:
 - FKN00GL17863: 36
 - FKN00GL3514: 31
 - FKN00GL9771: 30
 - FKN00GL15265: 29
 - FKN00GL17388: 23


#### updated_vehicle_type

- dtype: object
- non-null: 173196
- unique: 22
top values:
 - SCOOTER: 54867
 - CAR: 49936
 - MOTOR CYCLE: 23533
 - PASSENGER AUTO: 23007
 - MAXI-CAB: 7283


#### validation_status

- dtype: object
- non-null: 173196
- unique: 5
top values:
 - approved: 115400
 - rejected: 49754
 - created1: 7044
 - processing: 678
 - duplicate: 320


#### validation_timestamp

- dtype: object
- non-null: 173196
- unique: 170115
top values:
 - 2024-01-08 13:01:54.942+00: 5
 - 2024-01-09 14:28:48.817+00: 5
 - 2024-01-09 19:51:28.437+00: 5
 - 2024-01-09 14:28:48.751+00: 5
 - 2024-01-08 11:44:51.783+00: 5



### First 5 Rows

        id  latitude  longitude                                                                                                                                           location vehicle_number vehicle_type  description                                 violation_type offence_code       created_datetime  closed_datetime             modified_datetime  device_id created_by_id  center_code  police_station  data_sent_to_scita                   junction_name  action_taken_timestamp data_sent_to_scita_timestamp updated_vehicle_number updated_vehicle_type validation_status       validation_timestamp
FKID000000 12.925557  77.618665                                                                     18th Main Road, Block 2, Koramangala, Bengaluru, Karnataka. Pin-560068 (India)    FKN00GL0000          CAR          NaN ["WRONG PARKING","PARKING NEAR ROAD CROSSING"]    [112,104] 2023-11-20 00:28:46+00              NaN 2023-11-28 04:48:04.582978+00 FKDEV00000    FKUSR00000          9.0        Madiwala                True                     No Junction                     NaN                          NaN            FKN00GL0000             MAXI-CAB          approved 2023-11-30 03:08:24.818+00
FKID000001 12.905463  77.700778                                            Sarjapura Main Road, The Grove, Janatha Colony, Doddakannelli, Bengaluru, Karnataka. Pin-560035 (India)    FKN00GL0001          CAR          NaN                                 ["NO PARKING"]        [113] 2023-11-24 22:46:46+00              NaN 2023-11-24 23:00:24.115257+00 FKDEV00001    FKUSR00001         82.0       Bellandur               False                     No Junction                     NaN                          NaN                    NaN                  NaN               NaN                        NaN
FKID000002 12.925449  77.618504    Koramangala 2nd Block, Kormangala West, Bengaluru South City Corporation, Bengaluru, Bangalore South, Bengaluru Urban, Karnataka, 560034, India    FKN00GL0002          CAR          NaN     ["WRONG PARKING","PARKING IN A MAIN ROAD"]    [112,107] 2023-11-20 00:27:46+00              NaN  2023-11-28 04:47:02.33776+00 FKDEV00000    FKUSR00000          9.0        Madiwala                True                     No Junction                     NaN                          NaN            FKN00GL0002             MAXI-CAB          approved 2023-11-30 03:08:56.998+00
FKID000003 12.956521  77.518618                                                                6th Cross Road, Manasa Layout, Nagarbhavi, Bengaluru, Karnataka. Pin-560072 (India)    FKN00GL0003      SCOOTER          NaN                                 ["NO PARKING"]        [113] 2023-11-16 06:47:46+00              NaN 2023-11-18 04:46:57.216868+00 FKDEV00002    FKUSR00002         26.0 Byatarayanapura                True                     No Junction                     NaN                          NaN            FKN00GL0003              SCOOTER          approved 2023-11-18 23:35:12.428+00
FKID000004 12.977767  77.580545 Kalidasa Road, Gandhinagar, Nehru Nagar, Bengaluru Central City Corporation, Bengaluru, Bangalore North, Bengaluru Urban, Karnataka, 560009, India    FKN00GL0004       TANKER          NaN                                 ["NO PARKING"]        [113] 2023-11-22 04:56:46+00              NaN  2023-11-28 02:44:50.46737+00 FKDEV00003    FKUSR00003          3.0        Upparpet                True BTP044 - Sagar Theatre Junction                     NaN                          NaN            FKN00GL0004               TANKER          approved 2023-11-30 03:11:32.796+00


## Candidate Feature Mappings

### Events

| Phase 1 Target | Source Column | Notes |

| --- | --- | --- |

| `event_id` | `id` | suggested |

| `event_type` | `event_type` | suggested |

| `latitude` | `latitude` | suggested |

| `longitude` | `longitude` | suggested |

| `start_datetime` | `start_datetime` | suggested |

| `end_datetime` | `endlatitude` | suggested |

| `status` | `status` | suggested |

| `priority` | `priority` | suggested |

| `zone` | `zone` | suggested |

| `junction` | `junction` | suggested |

### Violations

| Phase 1 Target | Source Column | Notes |

| --- | --- | --- |

| `violation_id` | `id` | suggested |

| `latitude` | `latitude` | suggested |

| `longitude` | `longitude` | suggested |

| `violation_type` | `vehicle_type` | suggested |

| `created_datetime` | `created_datetime` | suggested |

| `validation_status` | `validation_status` | suggested |

| `junction_name` | `junction_name` | suggested |

| `police_station` | `police_station` | suggested |