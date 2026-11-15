"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icon";

/** Native modal focus management keeps long details out of the surrounding bento layout. */
export function DetailDialog({
  title,
  description,
  trigger,
  triggerClassName,
  children,
}: {
  title: string;
  description?: string;
  trigger: ReactNode;
  triggerClassName: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
      >
        {trigger}
      </button>
      <dialog
        ref={dialog}
        className="detail-dialog"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        onClose={() => setOpen(false)}
      >
        <header className="detail-dialog-header">
          <div>
            <h2 id={`${id}-title`}>{title}</h2>
            {description && <p id={`${id}-description`}>{description}</p>}
          </div>
          <button
            type="button"
            className="dialog-close"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
            Cerrar
          </button>
        </header>
        <div className="detail-dialog-body">{open ? children : null}</div>
      </dialog>
    </>
  );
}
