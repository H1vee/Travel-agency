import $7WpW4$intlStringsmodulejs from "./intlStrings.module.js";
import $7WpW4$react, {useEffect as $7WpW4$useEffect} from "react";
import {useId as $7WpW4$useId, useSlotId as $7WpW4$useSlotId} from "@react-aria/utils";
import {useLocalizedStringFormatter as $7WpW4$useLocalizedStringFormatter} from "@react-aria/i18n";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 



function $d6542812f0669241$export$a407b657d3044108(props, state, ref) {
    let { key: key, timer: timer, timeout: timeout, animation: animation } = props.toast;
    (0, $7WpW4$useEffect)(()=>{
        if (timer == null || timeout == null) return;
        timer.reset(timeout);
        return ()=>{
            timer.pause();
        };
    }, [
        timer,
        timeout
    ]);
    let [isEntered, setIsEntered] = (0, $7WpW4$react).useState(false);
    (0, $7WpW4$useEffect)(()=>{
        if (animation === 'entering' || animation === 'queued') setIsEntered(true);
    }, [
        animation
    ]);
    let titleId = (0, $7WpW4$useId)();
    let descriptionId = (0, $7WpW4$useSlotId)();
    let stringFormatter = (0, $7WpW4$useLocalizedStringFormatter)((0, ($parcel$interopDefault($7WpW4$intlStringsmodulejs))), '@react-aria/toast');
    return {
        toastProps: {
            role: 'alertdialog',
            'aria-modal': 'false',
            'aria-label': props['aria-label'],
            'aria-labelledby': props['aria-labelledby'] || titleId,
            'aria-describedby': props['aria-describedby'] || descriptionId,
            'aria-details': props['aria-details'],
            // Hide toasts that are animating out so VoiceOver doesn't announce them.
            'aria-hidden': animation === 'exiting' ? 'true' : undefined,
            tabIndex: 0
        },
        contentProps: {
            role: 'alert',
            'aria-atomic': 'true',
            style: {
                visibility: isEntered || animation === null ? 'visible' : 'hidden'
            }
        },
        titleProps: {
            id: titleId
        },
        descriptionProps: {
            id: descriptionId
        },
        closeButtonProps: {
            'aria-label': stringFormatter.format('close'),
            onPress: ()=>state.close(key)
        }
    };
}


export {$d6542812f0669241$export$a407b657d3044108 as useToast};
//# sourceMappingURL=useToast.module.js.map
