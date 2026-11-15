import type { SVGProps } from "react";
import { WaterdropIcon } from "@solar-icons/react/linear/waterdrop";
import { ThermometerIcon } from "@solar-icons/react/linear/thermometer";
import { CloudRainIcon } from "@solar-icons/react/linear/cloud-rain";
import { LayersMinimalisticIcon } from "@solar-icons/react/linear/layers-minimalistic";
import { MapPointIcon } from "@solar-icons/react/linear/map-point";
import { AltArrowRightIcon } from "@solar-icons/react/linear/alt-arrow-right";
import { LeafIcon } from "@solar-icons/react/linear/leaf";
import { FireIcon } from "@solar-icons/react/linear/fire";
import { CloseCircleIcon } from "@solar-icons/react/linear/close-circle";
import { ArrowRightDownIcon } from "@solar-icons/react/linear/arrow-right-down";
import { ArrowRightUpIcon } from "@solar-icons/react/linear/arrow-right-up";
import { InfoCircleIcon } from "@solar-icons/react/linear/info-circle";

import { MagnifierIcon } from "@solar-icons/react/linear/magnifier";
import { CheckCircleIcon } from "@solar-icons/react/linear/check-circle";

const icons = {
  search: MagnifierIcon,
  check: CheckCircleIcon,
  humidity: WaterdropIcon,
  temperature: ThermometerIcon,
  rain: CloudRainIcon,
  soil: LayersMinimalisticIcon,
  location: MapPointIcon,
  arrow: AltArrowRightIcon,
  leaf: LeafIcon,
  fire: FireIcon,
  close: CloseCircleIcon,
  "trend-down": ArrowRightDownIcon,
  "trend-up": ArrowRightUpIcon,
  info: InfoCircleIcon,
};
export type IconName = keyof typeof icons;

/** Per-icon imports keep the full Solar catalog out of the application's module graph. */
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  const Component = icons[name];
  return (
    <Component
      size={24}
      strokeWidth={1.7}
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}
