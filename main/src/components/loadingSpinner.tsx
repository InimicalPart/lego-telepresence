import {Spinner} from "@nextui-org/react";

export default function LoadingSpinner({
    size = "md",
    hidden = false
}: {
    size?: "sm" | "md" | "lg",
    hidden?: boolean
}) {
  return (
    <Spinner size={size} hidden={hidden} style={{
        display: hidden ? "none" : "block"
    }}/>
  );
}