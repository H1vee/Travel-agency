"use client";
import {
  DateInputField
} from "./chunk-VWPIOJXG.mjs";
import {
  DateInputGroup
} from "./chunk-LUAXTAMZ.mjs";
import {
  useDateInput
} from "./chunk-H3RBQN2M.mjs";

// src/date-input.tsx
import { forwardRef } from "@heroui/system";
import { jsx } from "react/jsx-runtime";
var DateInput = forwardRef(function DateInput2(props, ref) {
  const { state, slots, classNames, getBaseGroupProps, getInputProps, getFieldProps } = useDateInput({ ...props, ref });
  return /* @__PURE__ */ jsx(DateInputGroup, { ...getBaseGroupProps(), children: /* @__PURE__ */ jsx(
    DateInputField,
    {
      classNames,
      inputProps: getInputProps(),
      slots,
      state,
      ...getFieldProps()
    }
  ) });
});
var date_input_default = DateInput;

export {
  date_input_default
};
