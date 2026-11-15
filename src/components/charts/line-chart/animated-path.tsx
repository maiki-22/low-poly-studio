"use client";

import { memo, useLayoutEffect, useRef, type SVGProps } from "react";

/** Native path interpolation avoids React updates on every animation frame. */
export const AnimatedPath = memo(function AnimatedPath({
  d,
  motionKey,
  ...props
}: SVGProps<SVGPathElement> & { d: string; motionKey: string }) {
  const path = useRef<SVGPathElement>(null);
  const previous = useRef<{
    d: string;
    motionKey: string;
    displayed?: string;
  } | null>(null);
  useLayoutEffect(() => {
    const element = path.current;
    const from = previous.current;
    previous.current = { d, motionKey };
    if (
      !element ||
      !from ||
      from.d === d ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const sameShape =
      from.motionKey === motionKey &&
      from.d.match(/[MLZ]/g)?.join("") === d.match(/[MLZ]/g)?.join("");
    const frames =
      sameShape && CSS.supports("d", `path("${d}")`)
        ? [{ d: from.displayed ?? `path("${from.d}")` }, { d: `path("${d}")` }]
        : [{ opacity: 0.45 }, { opacity: 1 }];
    const animation = element.animate(frames, {
      duration: 220,
      easing: "cubic-bezier(.2,.7,.2,1)",
    });
    return () => {
      if (animation.playState === "running" && previous.current)
        previous.current.displayed =
          getComputedStyle(element).getPropertyValue("d");
      animation.cancel();
    };
  }, [d, motionKey]);
  return <path ref={path} d={d} {...props} />;
});
