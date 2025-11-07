"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardTypes = void 0;
exports.standardTypes = [
    "string",
    "number",
    "integer",
    "datetime",
    "date",
    "boolean",
    "any",
]
    .map((type) => [type, type + "[]"])
    .flat();
