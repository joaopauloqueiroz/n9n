"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType["EXECUTION_STARTED"] = "execution.started";
    EventType["EXECUTION_RESUMED"] = "execution.resumed";
    EventType["EXECUTION_WAITING"] = "execution.waiting";
    EventType["EXECUTION_COMPLETED"] = "execution.completed";
    EventType["EXECUTION_EXPIRED"] = "execution.expired";
    EventType["EXECUTION_ERROR"] = "execution.error";
    EventType["NODE_EXECUTED"] = "node.executed";
    EventType["WHATSAPP_MESSAGE_RECEIVED"] = "whatsapp.message.received";
    EventType["WHATSAPP_SESSION_CONNECTED"] = "whatsapp.session.connected";
    EventType["WHATSAPP_SESSION_DISCONNECTED"] = "whatsapp.session.disconnected";
    EventType["WHATSAPP_QR_CODE"] = "whatsapp.qr.code";
})(EventType || (exports.EventType = EventType = {}));
//# sourceMappingURL=events.types.js.map