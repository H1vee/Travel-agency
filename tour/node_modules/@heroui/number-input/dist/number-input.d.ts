import * as _heroui_system from '@heroui/system';
import { UseNumberInputProps } from './use-number-input.js';
import '@react-types/button';
import 'react';
import '@heroui/theme';
import '@react-types/numberfield';
import '@react-stately/numberfield';

interface NumberInputProps extends UseNumberInputProps {
}
declare const NumberInput: _heroui_system.InternalForwardRefRenderFunction<"input", NumberInputProps, never>;

export { type NumberInputProps, NumberInput as default };
