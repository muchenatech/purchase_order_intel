sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageToast"
],
function (Controller, JSONModel, DateFormat, MessageToast) {
    "use strict";

    return Controller.extend("com.tim.orderintel.controller.PurchaseOrder", {
        onInit: function () {
            this._timeFormatter = DateFormat.getTimeInstance({ pattern: "HH:mm" });

            const poModel = new JSONModel(this._getInitialPoData());
            this.getView().setModel(poModel, "po");

            const userModel = new JSONModel({
                displayName: "J. Smith (JSMITH)"
            });
            this.getView().setModel(userModel, "user");

            const chatModel = new JSONModel({
                messages: [
                    {
                        author: "assistant",
                        text: "Hello! I can see you're viewing PO 4500000001. Ask me anything about this PO, the vendor, or related materials."
                    }
                ],
                input: "",
                sending: false,
                statusText: "Connected to on-premise SAP Gateway",
                botApiKey: "",
                endpoint: "/chat",
                fallbackEndpoint: "http://localhost:3001/chat"
            });
            this.getView().setModel(chatModel, "chat");
        },

        onAskAssistant: function () {
            this._addQuickMessage("Give me a quick summary of this PO.");
        },

        onQuickAction: function (event) {
            const action = event.getSource().data("action");
            if (action) {
                this._addQuickMessage(action);
            }
        },

        onSendMessage: function () {
            const chatModel = this.getView().getModel("chat");
            const message = (chatModel.getProperty("/input") || "").trim();

            if (!message) {
                MessageToast.show("Enter a question to continue.");
                return;
            }

            this._appendMessage("user", message);
            chatModel.setProperty("/input", "");
            this._sendToAssistant(message);
        },

        onMaterialPress: function () {
            MessageToast.show("Material details are available in SAP.");
        },

        onToggleAssistant: function () {
            MessageToast.show("Assistant panel is pinned in this version.");
        },

        _sendToAssistant: async function (message) {
            const chatModel = this.getView().getModel("chat");
            chatModel.setProperty("/sending", true);
            chatModel.setProperty("/statusText", "Thinking...");

            try {
                const payload = await this._postChat(message);
                const reply = payload && payload.reply ? payload.reply : "No data found";
                this._appendMessage("assistant", reply);
                chatModel.setProperty("/statusText", "Connected to on-premise SAP Gateway");
            } catch (error) {
                this._appendMessage("assistant", "Assistant service unavailable. Ensure the backend is running on port 3001 and /chat is proxied.");
                chatModel.setProperty("/statusText", "Connection error");
                if (window && window.console) {
                    window.console.error("Assistant error:", error);
                }
            } finally {
                chatModel.setProperty("/sending", false);
            }
        },

        _appendMessage: function (author, text) {
            const chatModel = this.getView().getModel("chat");
            const messages = chatModel.getProperty("/messages") || [];
            messages.push({
                author: author,
                text: text,
                time: this._timeFormatter.format(new Date())
            });
            chatModel.setProperty("/messages", messages);
        },

        _addQuickMessage: function (message) {
            const chatModel = this.getView().getModel("chat");
            chatModel.setProperty("/input", message);
            this.onSendMessage();
        },

        _buildContext: function () {
            const poModel = this.getView().getModel("po");
            return {
                poNumber: poModel.getProperty("/poNumber"),
                companyCode: poModel.getProperty("/companyCode"),
                plant: poModel.getProperty("/plant"),
                purchasingOrg: poModel.getProperty("/purchasingOrg"),
                status: poModel.getProperty("/status"),
                vendor: poModel.getProperty("/vendor"),
                items: poModel.getProperty("/items")
            };
        },

        _postChat: async function (message) {
            const chatModel = this.getView().getModel("chat");
            const endpoint = chatModel.getProperty("/endpoint") || "/chat";
            const fallbackEndpoint = chatModel.getProperty("/fallbackEndpoint") || "";

            const attempt = async function (url) {
                const headers = {
                    "Content-Type": "application/json"
                };
                const botApiKey = chatModel.getProperty("/botApiKey");
                if (botApiKey) {
                    headers["x-bot-api-key"] = botApiKey;
                }

                const response = await fetch(url, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({
                        message: message,
                        context: this._buildContext()
                    })
                });

                const contentType = response.headers.get("content-type") || "";
                if (!contentType.includes("application/json")) {
                    const text = await response.text();
                    return {
                        okJson: false,
                        response: response,
                        text: text
                    };
                }

                const payload = await response.json();
                if (!response.ok) {
                    return {
                        okJson: false,
                        response: response,
                        text: (payload && payload.reply) || "Assistant service unavailable"
                    };
                }

                return {
                    okJson: true,
                    payload: payload
                };
            }.bind(this);

            let result = await attempt(endpoint);
            if (!result.okJson && fallbackEndpoint && fallbackEndpoint !== endpoint) {
                result = await attempt(fallbackEndpoint);
            }

            if (!result.okJson) {
                throw new Error(result.text || "Assistant service unavailable");
            }

            return result.payload;
        },

        _getInitialPoData: function () {
            return {
                poNumber: "4500000001",
                companyCode: "1000",
                plant: "1000",
                purchasingOrg: "1000",
                status: "Open",
                netValue: "R 125,000.00",
                docDate: "10 Mar 2025",
                vendor: {
                    id: "V001",
                    name: "Acme Supplies Ltd"
                },
                items: [
                    {
                        item: "10",
                        material: "MAT-1000",
                        description: "Steel Pipe 50mm",
                        qty: "200",
                        uom: "PC",
                        netPrice: "R 45,000.00",
                        deliveryDate: "20 Mar 2025",
                        status: "Open"
                    },
                    {
                        item: "20",
                        material: "MAT-1001",
                        description: "Copper Wire 2.5mm",
                        qty: "500",
                        uom: "M",
                        netPrice: "R 62,500.00",
                        deliveryDate: "22 Mar 2025",
                        status: "Pending"
                    },
                    {
                        item: "30",
                        material: "MAT-1002",
                        description: "Circuit Board Type A",
                        qty: "50",
                        uom: "PC",
                        netPrice: "R 17,500.00",
                        deliveryDate: "25 Mar 2025",
                        status: "Open"
                    }
                ],
                vendorDetails: [
                    {
                        vendorId: "V001",
                        name: "Acme Supplies Ltd",
                        city: "Johannesburg",
                        country: "ZA",
                        phone: "+27-11-555-0100",
                        paymentTerms: "Net 30"
                    }
                ]
            };
        }
    });
});
