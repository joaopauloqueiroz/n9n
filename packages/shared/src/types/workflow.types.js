"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappSessionStatus = exports.ExecutionStatus = exports.WorkflowNodeType = void 0;
var WorkflowNodeType;
(function (WorkflowNodeType) {
    WorkflowNodeType["TRIGGER_MESSAGE"] = "TRIGGER_MESSAGE";
    WorkflowNodeType["TRIGGER_SCHEDULE"] = "TRIGGER_SCHEDULE";
    WorkflowNodeType["SEND_MESSAGE"] = "SEND_MESSAGE";
    WorkflowNodeType["CONDITION"] = "CONDITION";
    WorkflowNodeType["WAIT_REPLY"] = "WAIT_REPLY";
    WorkflowNodeType["END"] = "END";
})(WorkflowNodeType || (exports.WorkflowNodeType = WorkflowNodeType = {}));
var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["RUNNING"] = "RUNNING";
    ExecutionStatus["WAITING"] = "WAITING";
    ExecutionStatus["COMPLETED"] = "COMPLETED";
    ExecutionStatus["EXPIRED"] = "EXPIRED";
    ExecutionStatus["ERROR"] = "ERROR";
})(ExecutionStatus || (exports.ExecutionStatus = ExecutionStatus = {}));
var WhatsappSessionStatus;
(function (WhatsappSessionStatus) {
    WhatsappSessionStatus["DISCONNECTED"] = "DISCONNECTED";
    WhatsappSessionStatus["CONNECTING"] = "CONNECTING";
    WhatsappSessionStatus["CONNECTED"] = "CONNECTED";
    WhatsappSessionStatus["QR_CODE"] = "QR_CODE";
    WhatsappSessionStatus["ERROR"] = "ERROR";
})(WhatsappSessionStatus || (exports.WhatsappSessionStatus = WhatsappSessionStatus = {}));
//# sourceMappingURL=workflow.types.js.map