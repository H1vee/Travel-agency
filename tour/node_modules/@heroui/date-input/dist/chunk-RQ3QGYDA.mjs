"use client";
import {
  DateInputField
} from "./chunk-VWPIOJXG.mjs";
import {
  DateInputGroup
} from "./chunk-LUAXTAMZ.mjs";
import {
  useTimeInput
} from "./chunk-YNRHOIAL.mjs";

// src/time-input.tsx
import { forwardRef } from "@heroui/system";
import { jsx } from "react/jsx-runtime";
var TimeInput = forwardRef(function TimeInput2(props, ref) {
  const { state, slots, classNames, getBaseGroupProps, getInputProps, getFieldProps } = useTimeInput({
    ...props,
    ref
  });
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
var time_input_default = TimeInput;

export {
  time_input_default
};
