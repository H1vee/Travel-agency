import {useMemo as $cNx9A$useMemo, useCallback as $cNx9A$useCallback} from "react";
import {useSyncExternalStore as $cNx9A$useSyncExternalStore} from "use-sync-external-store/shim/index.js";

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

function $77b352cf12efcf73$export$c7b26b20d3ced9c5(props = {}) {
    let { maxVisibleToasts: maxVisibleToasts = 1, hasExitAnimation: hasExitAnimation = false } = props;
    let queue = (0, $cNx9A$useMemo)(()=>new $77b352cf12efcf73$export$f1f8569633bbbec4({
            maxVisibleToasts: maxVisibleToasts,
            hasExitAnimation: hasExitAnimation
        }), [
        maxVisibleToasts,
        hasExitAnimation
    ]);
    return $77b352cf12efcf73$export$84726ef35ca2129a(queue);
}
function $77b352cf12efcf73$export$84726ef35ca2129a(queue) {
    let subscribe = (0, $cNx9A$useCallback)((fn)=>queue.subscribe(fn), [
        queue
    ]);
    let getSnapshot = (0, $cNx9A$useCallback)(()=>queue.visibleToasts, [
        queue
    ]);
    let visibleToasts = (0, $cNx9A$useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
    return {
        visibleToasts: visibleToasts,
        add: (content, options)=>queue.add(content, options),
        close: (key)=>queue.close(key),
        remove: (key)=>queue.remove(key),
        pauseAll: ()=>queue.pauseAll(),
        resumeAll: ()=>queue.resumeAll()
    };
}
class $77b352cf12efcf73$export$f1f8569633bbbec4 {
    /** Subscribes to updates to the visible toasts. */ subscribe(fn) {
        this.subscriptions.add(fn);
        return ()=>this.subscriptions.delete(fn);
    }
    /** Adds a new toast to the queue. */ add(content, options = {}) {
        let toastKey = Math.random().toString(36);
        let toast = {
            ...options,
            content: content,
            key: toastKey,
            timer: options.timeout ? new $77b352cf12efcf73$var$Timer(()=>this.close(toastKey), options.timeout) : undefined
        };
        let low = 0;
        let high = this.queue.length;
        while(low < high){
            let mid = Math.floor((low + high) / 2);
            if ((toast.priority || 0) > (this.queue[mid].priority || 0)) high = mid;
            else low = mid + 1;
        }
        this.queue.splice(low, 0, toast);
        toast.animation = low < this.maxVisibleToasts ? 'entering' : 'queued';
        let i = this.maxVisibleToasts;
        while(i < this.queue.length)this.queue[i++].animation = 'queued';
        this.updateVisibleToasts({
            action: 'add'
        });
        return toastKey;
    }
    /**
   * Closes a toast. If `hasExitAnimation` is true, the toast
   * transitions to an "exiting" state instead of being removed immediately.
   */ close(key) {
        let index = this.queue.findIndex((t)=>t.key === key);
        if (index >= 0) {
            var _this_queue_index_onClose, _this_queue_index;
            (_this_queue_index_onClose = (_this_queue_index = this.queue[index]).onClose) === null || _this_queue_index_onClose === void 0 ? void 0 : _this_queue_index_onClose.call(_this_queue_index);
            this.queue.splice(index, 1);
        }
        this.updateVisibleToasts({
            action: 'close',
            key: key
        });
    }
    /** Removes a toast from the visible toasts after an exiting animation. */ remove(key) {
        this.updateVisibleToasts({
            action: 'remove',
            key: key
        });
    }
    updateVisibleToasts(options) {
        let { action: action, key: key } = options;
        let toasts = this.queue.slice(0, this.maxVisibleToasts);
        if (action === 'add' && this.hasExitAnimation) {
            let prevToasts = this.visibleToasts.filter((t)=>!toasts.some((t2)=>t.key === t2.key)).map((t)=>({
                    ...t,
                    animation: 'exiting'
                }));
            this.visibleToasts = prevToasts.concat(toasts).sort((a, b)=>{
                var _b_priority, _a_priority;
                return ((_b_priority = b.priority) !== null && _b_priority !== void 0 ? _b_priority : 0) - ((_a_priority = a.priority) !== null && _a_priority !== void 0 ? _a_priority : 0);
            });
        } else if (action === 'close' && this.hasExitAnimation) // Cause a rerender to happen for exit animation
        this.visibleToasts = this.visibleToasts.map((t)=>{
            if (t.key !== key) return t;
            else return {
                ...t,
                animation: 'exiting'
            };
        });
        else this.visibleToasts = toasts;
        for (let fn of this.subscriptions)fn();
    }
    /** Pauses the timers for all visible toasts. */ pauseAll() {
        for (let toast of this.visibleToasts)if (toast.timer) toast.timer.pause();
    }
    /** Resumes the timers for all visible toasts. */ resumeAll() {
        for (let toast of this.visibleToasts)if (toast.timer) toast.timer.resume();
    }
    constructor(options){
        this.queue = [];
        this.subscriptions = new Set();
        /** The currently visible toasts. */ this.visibleToasts = [];
        var _options_maxVisibleToasts;
        this.maxVisibleToasts = (_options_maxVisibleToasts = options === null || options === void 0 ? void 0 : options.maxVisibleToasts) !== null && _options_maxVisibleToasts !== void 0 ? _options_maxVisibleToasts : 1;
        var _options_hasExitAnimation;
        this.hasExitAnimation = (_options_hasExitAnimation = options === null || options === void 0 ? void 0 : options.hasExitAnimation) !== null && _options_hasExitAnimation !== void 0 ? _options_hasExitAnimation : false;
    }
}
class $77b352cf12efcf73$var$Timer {
    reset(delay) {
        this.remaining = delay;
        this.resume();
    }
    pause() {
        if (this.timerId == null) return;
        clearTimeout(this.timerId);
        this.timerId = null;
        this.remaining -= Date.now() - this.startTime;
    }
    resume() {
        if (this.remaining <= 0) return;
        this.startTime = Date.now();
        this.timerId = setTimeout(()=>{
            this.timerId = null;
            this.remaining = 0;
            this.callback();
        }, this.remaining);
    }
    constructor(callback, delay){
        this.startTime = null;
        this.remaining = delay;
        this.callback = callback;
    }
}


export {$77b352cf12efcf73$export$c7b26b20d3ced9c5 as useToastState, $77b352cf12efcf73$export$f1f8569633bbbec4 as ToastQueue, $77b352cf12efcf73$export$84726ef35ca2129a as useToastQueue};
//# sourceMappingURL=useToastState.module.js.map
