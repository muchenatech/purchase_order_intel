## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Wed Mar 18 2026 11:03:07 GMT+0200 (South Africa Standard Time)|
|**App Generator**<br>SAP Fiori Application Generator|
|**App Generator Version**<br>1.21.0|
|**Generation Platform**<br>Visual Studio Code|
|**Template Used**<br>Basic V2|
|**Service Type**<br>SAP System (ABAP On-Premise)|
|**Service URL**<br>https://vngdci.sap.shoprite.co.za:44329/sap/opu/odata/sap/ZRST_AI_POC_SRV|
|**Module Name**<br>orderintel|
|**Application Title**<br>Order Intelligence Application|
|**Namespace**<br>com.tim|
|**UI5 Theme**<br>sap_horizon|
|**UI5 Version**<br>1.108.46|
|**Enable TypeScript**<br>False|
|**Add Eslint configuration**<br>False|

## orderintel

Order Intelligence Application

### Backend (AI Assistant)

This project includes an Express backend for OpenAI function calling and SAP OData access.

1. Copy `server/.env.example` to `server/.env` and set values for:
   - `OPENAI_API_KEY`
   - `SAP_ODATA_BASE_URL`
   - `SAP_PO_DETAILS_PATH`, `SAP_VENDOR_DETAILS_PATH`, `SAP_PURCHASE_ORDERS_PATH`
   - SAP authentication (`SAP_USERNAME` + `SAP_PASSWORD` or `SAP_BEARER_TOKEN`)
2. Start the backend:

```
    npm run server
```

### Starting the generated app

-   This app has been generated using the SAP Fiori tools - App Generator, as part of the SAP Fiori tools suite.  To launch the generated application, run the following from the generated application root folder:

```
    npm start
```

- It is also possible to run the application using mock data that reflects the OData Service URL supplied during application generation.  In order to run the application with Mock Data, run the following from the generated app root folder:

```
    npm run start-mock
```

#### Pre-requisites:

1. Active NodeJS LTS (Long Term Support) version and associated supported NPM version.  (See https://nodejs.org)

