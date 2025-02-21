"use client";
import {
  table_select_all_checkbox_default
} from "./chunk-PRBPVC6X.mjs";
import {
  useTable
} from "./chunk-6P56MRLR.mjs";
import {
  virtualized_table_body_default
} from "./chunk-RBALAGDS.mjs";
import {
  table_column_header_default
} from "./chunk-PZT4K2LB.mjs";
import {
  table_header_row_default
} from "./chunk-V2BF6S4T.mjs";
import {
  table_row_group_default
} from "./chunk-DVOW65RZ.mjs";

// src/virtualized-table.tsx
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Spacer } from "@heroui/spacer";
import { forwardRef } from "@heroui/system";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var VirtualizedTable = forwardRef((props, ref) => {
  const {
    BaseComponent,
    Component,
    collection,
    values,
    topContent,
    topContentPlacement,
    bottomContentPlacement,
    bottomContent,
    removeWrapper,
    getBaseProps,
    getWrapperProps,
    getTableProps
  } = useTable({
    ...props,
    ref
  });
  const { rowHeight = 40, maxTableHeight = 600 } = props;
  const Wrapper = useCallback(
    ({ children }) => {
      if (removeWrapper) {
        return children;
      }
      return /* @__PURE__ */ jsx(
        BaseComponent,
        {
          ...getWrapperProps(),
          ref: parentRef,
          style: { height: maxTableHeight, display: "block" },
          children
        }
      );
    },
    [removeWrapper, getWrapperProps, maxTableHeight]
  );
  const items = [...collection.body.childNodes];
  const count = items.length;
  const parentRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);
  useLayoutEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.getBoundingClientRect().height);
    }
  }, [headerRef]);
  const rowVirtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5
  });
  return /* @__PURE__ */ jsx("div", { ...getBaseProps(), children: /* @__PURE__ */ jsx(Wrapper, { children: /* @__PURE__ */ jsxs(Fragment, { children: [
    topContentPlacement === "outside" && topContent,
    /* @__PURE__ */ jsx("div", { style: { height: `calc(${rowVirtualizer.getTotalSize() + headerHeight}px)` }, children: /* @__PURE__ */ jsxs(Fragment, { children: [
      topContentPlacement === "inside" && topContent,
      /* @__PURE__ */ jsxs(Component, { ...getTableProps(), children: [
        /* @__PURE__ */ jsxs(table_row_group_default, { ref: headerRef, classNames: values.classNames, slots: values.slots, children: [
          collection.headerRows.map((headerRow) => /* @__PURE__ */ jsx(
            table_header_row_default,
            {
              classNames: values.classNames,
              node: headerRow,
              slots: values.slots,
              state: values.state,
              children: [...headerRow.childNodes].map(
                (column) => {
                  var _a;
                  return ((_a = column == null ? void 0 : column.props) == null ? void 0 : _a.isSelectionCell) ? /* @__PURE__ */ jsx(
                    table_select_all_checkbox_default,
                    {
                      checkboxesProps: values.checkboxesProps,
                      classNames: values.classNames,
                      color: values.color,
                      disableAnimation: values.disableAnimation,
                      node: column,
                      selectionMode: values.selectionMode,
                      slots: values.slots,
                      state: values.state
                    },
                    column == null ? void 0 : column.key
                  ) : /* @__PURE__ */ jsx(
                    table_column_header_default,
                    {
                      classNames: values.classNames,
                      node: column,
                      slots: values.slots,
                      state: values.state
                    },
                    column == null ? void 0 : column.key
                  );
                }
              )
            },
            headerRow == null ? void 0 : headerRow.key
          )),
          /* @__PURE__ */ jsx(Spacer, { as: "tr", tabIndex: -1, y: 1 })
        ] }),
        /* @__PURE__ */ jsx(
          virtualized_table_body_default,
          {
            checkboxesProps: values.checkboxesProps,
            classNames: values.classNames,
            collection: values.collection,
            color: values.color,
            disableAnimation: values.disableAnimation,
            isSelectable: values.isSelectable,
            rowVirtualizer,
            selectionMode: values.selectionMode,
            slots: values.slots,
            state: values.state
          }
        )
      ] }),
      bottomContentPlacement === "inside" && bottomContent
    ] }) }),
    bottomContentPlacement === "outside" && bottomContent
  ] }) }) });
});
VirtualizedTable.displayName = "HeroUI.VirtualizedTable";
var virtualized_table_default = VirtualizedTable;

export {
  virtualized_table_default
};
