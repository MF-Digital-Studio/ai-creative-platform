"use client";

import { useEffect, useId, useRef, useState } from "react";

const OPEN_POPOVER_EVENT = "app:open-popover";

type OpenPopoverEvent = CustomEvent<{ id: string }>;

export function useDismissiblePopover() {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleOtherPopover(event: Event) {
      if ((event as OpenPopoverEvent).detail.id !== id) setIsOpen(false);
    }

    window.addEventListener(OPEN_POPOVER_EVENT, handleOtherPopover);
    return () => window.removeEventListener(OPEN_POPOVER_EVENT, handleOtherPopover);
  }, [id]);

  useEffect(() => {
    if (!isOpen) return;

    window.dispatchEvent(new CustomEvent(OPEN_POPOVER_EVENT, { detail: { id } }));

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [id, isOpen]);

  function open() {
    setIsOpen(true);
  }

  function close(restoreFocus = false) {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  return { close, isOpen, open, rootRef, toggle, triggerRef };
}
