import * as tailwind_variants from 'tailwind-variants';
import { VariantProps } from 'tailwind-variants';
import * as tailwind_variants_dist_config from 'tailwind-variants/dist/config';

/**
 * Spacer wrapper **Tailwind Variants** component
 *
 * @example
 *
 * const styles = spacer()
 *
 * <span className={styles} />
 */
declare const spacer: tailwind_variants.TVReturnType<{
    isInline: {
        true: string;
        false: string;
    };
}, undefined, "w-px h-px inline-block", tailwind_variants_dist_config.TVConfig<{
    isInline: {
        true: string;
        false: string;
    };
}, {
    isInline: {
        true: string;
        false: string;
    };
}>, {
    isInline: {
        true: string;
        false: string;
    };
}, undefined, tailwind_variants.TVReturnType<{
    isInline: {
        true: string;
        false: string;
    };
}, undefined, "w-px h-px inline-block", tailwind_variants_dist_config.TVConfig<{
    isInline: {
        true: string;
        false: string;
    };
}, {
    isInline: {
        true: string;
        false: string;
    };
}>, unknown, unknown, undefined>>;
type SpacerVariantProps = VariantProps<typeof spacer>;

export { type SpacerVariantProps, spacer };
