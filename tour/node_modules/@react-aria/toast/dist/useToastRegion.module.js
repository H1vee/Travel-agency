import $ckyCP$intlStringsmodulejs from "./intlStrings.module.js";
import {useLayoutEffect as $ckyCP$useLayoutEffect, focusWithoutScrolling as $ckyCP$focusWithoutScrolling, mergeProps as $ckyCP$mergeProps} from "@react-aria/utils";
import {useHover as $ckyCP$useHover, useFocusWithin as $ckyCP$useFocusWithin, getInteractionModality as $ckyCP$getInteractionModality} from "@react-aria/interactions";
import {useRef as $ckyCP$useRef, useEffect as $ckyCP$useEffect} from "react";
import {useLandmark as $ckyCP$useLandmark} from "@react-aria/landmark";
import {useLocalizedStringFormatter as $ckyCP$useLocalizedStringFormatter} from "@react-aria/i18n";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}






function $6cc546b19ee7130a$export$b8cbbb20a51697de(props, state, ref) {
    let stringFormatter = (0, $ckyCP$useLocalizedStringFormatter)((0, ($parcel$interopDefault($ckyCP$intlStringsmodulejs))), '@react-aria/toast');
    let { landmarkProps: landmarkProps } = (0, $ckyCP$useLandmark)({
        role: 'region',
        'aria-label': props['aria-label'] || stringFormatter.format('notifications', {
            count: state.visibleToasts.length
        })
    }, ref);
    let { hoverProps: hoverProps } = (0, $ckyCP$useHover)({
        onHoverStart: state.pauseAll,
        onHoverEnd: state.resumeAll
    });
    // Manage focus within the toast region.
    // If a focused containing toast is removed, move focus to the next toast, or the previous toast if there is no next toast.
    // We might be making an assumption with how this works if someone implements the priority queue differently, or
    // if they only show one toast at a time.
    let toasts = (0, $ckyCP$useRef)([]);
    let prevVisibleToasts = (0, $ckyCP$useRef)(state.visibleToasts);
    let focusedToast = (0, $ckyCP$useRef)(null);
    (0, $ckyCP$useLayoutEffect)(()=>{
        // If no toast has focus, then don't do anything.
        if (focusedToast.current === -1 || state.visibleToasts.length === 0 || !ref.current) {
            toasts.current = [];
            prevVisibleToasts.current = state.visibleToasts;
            return;
        }
        toasts.current = [
            ...ref.current.querySelectorAll('[role="alertdialog"]')
        ];
        // If the visible toasts haven't changed, we don't need to do anything.
        if (prevVisibleToasts.current.length === state.visibleToasts.length && state.visibleToasts.every((t, i)=>t.key === prevVisibleToasts.current[i].key)) {
            prevVisibleToasts.current = state.visibleToasts;
            return;
        }
        // Get a list of all toasts by index and add info if they are removed.
        let allToasts = prevVisibleToasts.current.map((t, i)=>({
                ...t,
                i: i,
                isRemoved: !state.visibleToasts.some((t2)=>t.key === t2.key)
            }));
        let removedFocusedToastIndex = allToasts.findIndex((t)=>t.i === focusedToast.current);
        // If the focused toast was removed, focus the next or previous toast.
        if (removedFocusedToastIndex > -1) {
            let i = 0;
            let nextToast;
            let prevToast;
            while(i <= removedFocusedToastIndex){
                if (!allToasts[i].isRemoved) prevToast = Math.max(0, i - 1);
                i++;
            }
            while(i < allToasts.length){
                if (!allToasts[i].isRemoved) {
                    nextToast = i - 1;
                    break;
                }
                i++;
            }
            // in the case where it's one toast at a time, both will be undefined, but we know the index must be 0
            if (prevToast === undefined && nextToast === undefined) prevToast = 0;
            // prioritize going to newer toasts
            if (prevToast >= 0 && prevToast < toasts.current.length) (0, $ckyCP$focusWithoutScrolling)(toasts.current[prevToast]);
            else if (nextToast >= 0 && nextToast < toasts.current.length) (0, $ckyCP$focusWithoutScrolling)(toasts.current[nextToast]);
        }
        prevVisibleToasts.current = state.visibleToasts;
    }, [
        state.visibleToasts,
        ref
    ]);
    let lastFocused = (0, $ckyCP$useRef)(null);
    let { focusWithinProps: focusWithinProps } = (0, $ckyCP$useFocusWithin)({
        onFocusWithin: (e)=>{
            state.pauseAll();
            lastFocused.current = e.relatedTarget;
        },
        onBlurWithin: ()=>{
            state.resumeAll();
            lastFocused.current = null;
        }
    });
    // When the number of visible toasts becomes 0 or the region unmounts,
    // restore focus to the last element that had focus before the user moved focus
    // into the region. FocusScope restore focus doesn't update whenever the focus
    // moves in, it only happens once, so we correct it.
    // Because we're in a hook, we can't control if the user unmounts or not.
    (0, $ckyCP$useEffect)(()=>{
        if (state.visibleToasts.length === 0 && lastFocused.current && document.body.contains(lastFocused.current)) {
            if ((0, $ckyCP$getInteractionModality)() === 'pointer') (0, $ckyCP$focusWithoutScrolling)(lastFocused.current);
            else lastFocused.current.focus();
            lastFocused.current = null;
        }
    }, [
        ref,
        state.visibleToasts.length
    ]);
    (0, $ckyCP$useEffect)(()=>{
        return ()=>{
            if (lastFocused.current && document.body.contains(lastFocused.current)) {
                if ((0, $ckyCP$getInteractionModality)() === 'pointer') (0, $ckyCP$focusWithoutScrolling)(lastFocused.current);
                else lastFocused.current.focus();
                lastFocused.current = null;
            }
        };
    }, [
        ref
    ]);
    return {
        regionProps: (0, $ckyCP$mergeProps)(landmarkProps, hoverProps, focusWithinProps, {
            tabIndex: -1,
            // Mark the toast region as a "top layer", so that it:
            //   - is not aria-hidden when opening an overlay
            //   - allows focus even outside a containing focus scope
            //   - doesn’t dismiss overlays when clicking on it, even though it is outside
            // @ts-ignore
            'data-react-aria-top-layer': true,
            // listen to focus events separate from focuswithin because that will only fire once
            // and we need to follow all focus changes
            onFocus: (e)=>{
                let target = e.target.closest('[role="alertdialog"]');
                focusedToast.current = toasts.current.findIndex((t)=>t === target);
            },
            onBlur: ()=>{
                focusedToast.current = -1;
            }
        })
    };
}


export {$6cc546b19ee7130a$export$b8cbbb20a51697de as useToastRegion};
//# sourceMappingURL=useToastRegion.module.js.map
