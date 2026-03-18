import axios from "axios";

const {
    SAP_ODATA_BASE_URL,
    SAP_USERNAME,
    SAP_PASSWORD,
    SAP_BEARER_TOKEN,
    SAP_CLIENT,
    SAP_PO_DETAILS_PATH,
    SAP_VENDOR_DETAILS_PATH,
    SAP_PURCHASE_ORDERS_PATH,
    SAP_TIMEOUT_MS
} = process.env;

const DEFAULT_TIMEOUT = Number(SAP_TIMEOUT_MS || 15000);

const http = axios.create({
    baseURL: (SAP_ODATA_BASE_URL || "").replace(/\/+$/, ""),
    timeout: DEFAULT_TIMEOUT
});

function encodeODataString(value) {
    return String(value).replace(/'/g, "''");
}

function applyPathTemplate(pathTemplate, params) {
    return pathTemplate.replace(/\{(\w+)\}/g, (_, key) => {
        if (!(key in params)) {
            return "";
        }
        const encoded = encodeURIComponent(encodeODataString(params[key]));
        return encoded;
    });
}

function buildUrl(pathTemplate, params, query) {
    const path = applyPathTemplate(pathTemplate, params);
    const url = `${path}`;
    const searchParams = new URLSearchParams();

    if (SAP_CLIENT) {
        searchParams.set("sap-client", SAP_CLIENT);
    }

    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                searchParams.set(key, value);
            }
        });
    }

    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
}

function getAuthHeaders() {
    if (SAP_BEARER_TOKEN) {
        return { Authorization: `Bearer ${SAP_BEARER_TOKEN}` };
    }
    if (SAP_USERNAME && SAP_PASSWORD) {
        const token = Buffer.from(`${SAP_USERNAME}:${SAP_PASSWORD}`).toString("base64");
        return { Authorization: `Basic ${token}` };
    }
    return {};
}

function sanitizeSapError(error) {
    if (!error) {
        return "SAP request failed";
    }
    if (error.response && error.response.status) {
        return `SAP request failed with status ${error.response.status}`;
    }
    return "SAP request failed";
}

async function callSap(pathTemplate, params, query) {
    if (!SAP_ODATA_BASE_URL) {
        throw new Error("SAP base URL not configured");
    }
    const url = buildUrl(pathTemplate, params, query);
    try {
        const response = await http.get(url, {
            headers: {
                Accept: "application/json",
                ...getAuthHeaders()
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(sanitizeSapError(error));
    }
}

export async function getPurchaseOrderDetails({ poNumber }) {
    if (!SAP_PO_DETAILS_PATH) {
        throw new Error("SAP PO details path not configured");
    }
    return callSap(SAP_PO_DETAILS_PATH, { poNumber });
}

export async function getVendorDetails({ vendor }) {
    if (!SAP_VENDOR_DETAILS_PATH) {
        throw new Error("SAP vendor details path not configured");
    }
    return callSap(SAP_VENDOR_DETAILS_PATH, { vendor });
}

export async function getPurchaseOrders({ vendor, status, dateFrom, dateTo, top }) {
    if (!SAP_PURCHASE_ORDERS_PATH) {
        throw new Error("SAP purchase orders path not configured");
    }

    const filters = [];
    if (vendor) {
        filters.push(`Vendor eq '${encodeODataString(vendor)}'`);
    }
    if (status) {
        filters.push(`Status eq '${encodeODataString(status)}'`);
    }
    if (dateFrom) {
        filters.push(`DocDate ge datetime'${encodeODataString(dateFrom)}'`);
    }
    if (dateTo) {
        filters.push(`DocDate le datetime'${encodeODataString(dateTo)}'`);
    }

    const query = {};
    if (filters.length > 0) {
        query.$filter = filters.join(" and ");
    }
    if (top) {
        query.$top = top;
    }

    return callSap(SAP_PURCHASE_ORDERS_PATH, {}, query);
}
