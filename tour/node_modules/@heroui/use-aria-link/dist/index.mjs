// src/index.ts
import {
  filterDOMProps,
  mergeProps,
  useRouter,
  shouldClientNavigate,
  useLinkProps,
  isAndroid,
  isIOS
} from "@react-aria/utils";
import { warn } from "@heroui/shared-utils";
import { useFocusable } from "@react-aria/focus";
import { usePress } from "@react-aria/interactions";
function useAriaLink(props, ref) {
  let {
    elementType = "a",
    onPress,
    onPressStart,
    onPressEnd,
    // @ts-ignore
    onClick: deprecatedOnClick,
    role,
    isDisabled,
    type,
    ...otherProps
  } = props;
  let linkProps = {};
  if (elementType !== "a") {
    linkProps = {
      role: "link",
      tabIndex: !isDisabled ? 0 : void 0
    };
  }
  let isMobile = isIOS() || isAndroid();
  if (deprecatedOnClick && typeof deprecatedOnClick === "function" && // bypass since onClick is passed from <Link as="button" /> internally
  type !== "button" && // bypass since onClick is passed from <Button as={Link} /> internally
  role !== "button") {
    warn(
      "onClick is deprecated, please use onPress instead. See: https://github.com/heroui-inc/heroui/issues/4292",
      "useLink"
    );
  }
  const handlePress = (e) => {
    if (isMobile) {
      deprecatedOnClick == null ? void 0 : deprecatedOnClick(e);
    }
    onPress == null ? void 0 : onPress(e);
  };
  let { focusableProps } = useFocusable(props, ref);
  let { pressProps, isPressed } = usePress({
    onPress: handlePress,
    onPressStart,
    onPressEnd,
    isDisabled,
    ref
  });
  let domProps = filterDOMProps(otherProps, { labelable: true, isLink: elementType === "a" });
  let interactionHandlers = mergeProps(focusableProps, pressProps);
  let router = useRouter();
  let routerLinkProps = useLinkProps(props);
  return {
    isPressed,
    // Used to indicate press state for visual
    linkProps: mergeProps(domProps, routerLinkProps, {
      ...interactionHandlers,
      ...linkProps,
      "aria-disabled": isDisabled || void 0,
      "aria-current": props["aria-current"],
      onClick: (e) => {
        var _a;
        (_a = pressProps.onClick) == null ? void 0 : _a.call(pressProps, e);
        if (!isMobile && deprecatedOnClick) {
          deprecatedOnClick(e);
        }
        if (!router.isNative && e.currentTarget instanceof HTMLAnchorElement && e.currentTarget.href && // If props are applied to a router Link component, it may have already prevented default.
        !e.isDefaultPrevented() && shouldClientNavigate(e.currentTarget, e) && props.href) {
          e.preventDefault();
          router.open(e.currentTarget, e, props.href, props.routerOptions);
        }
      }
    })
  };
}
export {
  useAriaLink
};
