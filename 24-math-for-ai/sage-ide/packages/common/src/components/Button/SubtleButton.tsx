import { Button, ButtonProps, PolymorphicComponentProps } from "@mantine/core";
import { forwardRef, ReactNode } from "react";

export const SubtleButton = forwardRef((props, ref) => {
  return <Button {...props} ref={ref as any} variant="variable-subtle" />;
}) as unknown as <C = "button">(props: PolymorphicComponentProps<C, ButtonProps>) => ReactNode;
