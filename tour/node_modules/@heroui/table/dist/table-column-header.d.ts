import * as _heroui_system from '@heroui/system';
import { HTMLHeroUIProps } from '@heroui/system';
import { GridNode } from '@react-types/grid';
import { ValuesType } from './use-table.js';
import '@react-types/table';
import 'react';
import '@heroui/theme';
import '@react-stately/virtualizer';
import '@react-types/shared';
import '@react-stately/table';
import '@react-aria/table';
import '@heroui/react-utils';
import '@heroui/checkbox';

interface TableColumnHeaderProps<T = object> extends HTMLHeroUIProps<"th"> {
    slots: ValuesType["slots"];
    state: ValuesType["state"];
    classNames?: ValuesType["classNames"];
    /**
     * The table node to render.
     */
    node: GridNode<T>;
}
declare const TableColumnHeader: _heroui_system.InternalForwardRefRenderFunction<"th", TableColumnHeaderProps<object>, never>;

export { type TableColumnHeaderProps, TableColumnHeader as default };
