/*
 * Collection of const / functions for getting device capabilities
 */

import { primaryInput } from "detect-it";

export const isTouchDevice = primaryInput === "touch";
