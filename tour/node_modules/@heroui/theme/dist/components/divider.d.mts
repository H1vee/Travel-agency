import * as tailwind_variants from 'tailwind-variants';
import { VariantProps } from 'tailwind-variants';
import * as tailwind_variants_dist_config from 'tailwind-variants/dist/config';

/**
 * Divider wrapper **Tailwind Variants** component
 *
 * @example
 *
 * const styles = divider()
 *
 * <span className={styles} />
 */
declare const divider: tailwind_variants.TVReturnType<{
    orientation: {
        horizontal: string;
        vertical: string;
    };
}, undefined, "shrink-0 bg-divider border-none", tailwind_variants_dist_config.TVConfig<{
    orientation: {
        horizontal: string;
        vertical: string;
    };
}, {
    orientation: {
        horizontal: string;
        vertical: string;
    };
}>, {
    orientation: {
        horizontal: string;
        vertical: string;
    };
}, undefined, tailwind_variants.TVReturnType<{
    orientation: {
        horizontal: string;
        vertical: string;
    };
}, undefined, "shrink-0 bg-divider border-none", tailwind_variants_dist_config.TVConfig<{
    orientation: {
        horizontal: string;
        vertical: string;
    };
}, {
    orientation: {
        horizontal: string;
        vertical: string;
    };
}>, unknown, unknown, undefined>>;
type DividerVariantProps = VariantProps<typeof divider>;

export { type DividerVariantProps, divider };
