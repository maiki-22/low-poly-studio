"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import communes from "@/data/communes.json";
import { Icon } from "@/components/ui/icon";
import { UI_LOCALE } from "@/lib/locale";

const options = [
  { id: "09", name: "All of La Araucanía", province: "Region" },
  ...communes,
];
const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase(UI_LOCALE);

export function TerritoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState<CSSProperties>({});
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.id === value) ?? options[0];
  const filtered = useMemo(
    () =>
      options.filter((option) =>
        normalize(`${option.name} ${option.province}`).includes(
          normalize(query),
        ),
      ),
    [query],
  );
  function positionMenu() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(360, window.innerWidth - 32);
    const below = window.innerHeight - rect.bottom - 24;
    const above = rect.top - 24;
    const down = below >= 240 || below >= above;
    setPlacement({
      left: Math.max(
        16,
        Math.min(rect.right - width, window.innerWidth - width - 16),
      ),
      width,
      top: down ? rect.bottom + 8 : undefined,
      bottom: down ? undefined : window.innerHeight - rect.top + 8,
      maxHeight: Math.min(480, Math.max(160, down ? below : above)),
    });
  }
  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }
  function choose(id: string) {
    onChange(id);
    close(true);
  }
  function toggle() {
    if (open) {
      close();
      return;
    }
    setQuery("");
    setActive(
      Math.max(
        0,
        options.findIndex((option) => option.id === value),
      ),
    );
    positionMenu();
    setOpen(true);
  }
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menu.current?.contains(event.target) &&
        !trigger.current?.contains(event.target)
      )
        setOpen(false);
    };
    const resize = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resize);
    };
  }, [open]);
  useEffect(() => {
    if (open)
      menu.current
        ?.querySelector(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  return (
    <div className="territory-picker">
      <button
        ref={trigger}
        id="territory-select"
        className="territory-trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? "territory-menu" : undefined}
        aria-label={`Area: ${selected.name}`}
        data-value={value}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            toggle();
          }
        }}
        onClick={toggle}
      >
        <Icon name="location" />
        <span>{selected.name}</span>
        <Icon name="arrow" className="picker-chevron" />
      </button>
      {open && (
        <div
          ref={menu}
          id="territory-menu"
          className="territory-menu"
          role="dialog"
          aria-label="Choose an area"
          style={placement}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              close(true);
            }
          }}
        >
          <label className="territory-search">
            <Icon name="search" />
            <span className="sr-only">Search areas</span>
            <input
              ref={search}
              name="search-area"
              type="search"
              value={query}
              placeholder="Search municipalities…"
              autoComplete="off"
              role="combobox"
              aria-expanded="true"
              aria-autocomplete="list"
              aria-controls="territory-list"
              aria-activedescendant={
                filtered[active]
                  ? `territory-${filtered[active].id}`
                  : undefined
              }
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (
                  ["ArrowDown", "ArrowUp"].includes(event.key) ||
                  (!query && ["Home", "End"].includes(event.key))
                ) {
                  event.preventDefault();
                  setActive((previous) =>
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? filtered.length - 1
                        : Math.max(
                            0,
                            Math.min(
                              filtered.length - 1,
                              previous + (event.key === "ArrowDown" ? 1 : -1),
                            ),
                          ),
                  );
                }
                if (event.key === "Enter" && filtered[active]) {
                  event.preventDefault();
                  choose(filtered[active].id);
                }
              }}
            />
          </label>
          <div
            className="territory-list"
            id="territory-list"
            role="listbox"
            aria-label="Available areas"
          >
            {filtered.map((option, index) => (
              <button
                key={option.id}
                id={`territory-${option.id}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={option.id === value}
                data-territory-id={option.id}
                data-index={index}
                data-active={active === index || undefined}
                onPointerMove={() => setActive(index)}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(option.id)}
              >
                <span>
                  <strong>{option.name}</strong>
                  <small>{option.province}</small>
                </span>
                {option.id === value && <Icon name="check" />}
              </button>
            ))}
            {!filtered.length && (
              <p className="territory-empty">No matching municipality found.</p>
            )}
          </div>
          <p className="territory-result-count" role="status">
            {filtered.length}{" "}
            {filtered.length === 1
              ? "area available"
              : "areas available"}
          </p>
        </div>
      )}
    </div>
  );
}
