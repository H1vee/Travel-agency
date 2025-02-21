"use client";
import {
  useCalendar
} from "./chunk-TSHOTATE.mjs";
import {
  CalendarBase
} from "./chunk-XPMFI4TR.mjs";
import {
  CalendarProvider
} from "./chunk-PEV3D27N.mjs";

// src/calendar.tsx
import { forwardRef } from "@heroui/system";
import { jsx } from "react/jsx-runtime";
var Calendar = forwardRef(function Calendar2(props, ref) {
  const { context, getBaseCalendarProps } = useCalendar({ ...props, ref });
  return /* @__PURE__ */ jsx(CalendarProvider, { value: context, children: /* @__PURE__ */ jsx(CalendarBase, { ...getBaseCalendarProps() }) });
});
var calendar_default = Calendar;

export {
  calendar_default
};
