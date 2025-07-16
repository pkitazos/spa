"use client";

import React, {
  createContext,
  type Dispatch,
  forwardRef,
  type SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Input, type InputProps } from "./input";

const DestructiveActionContext = createContext<{
  action: () => void;
  requiresVerification: boolean;
  verified: boolean;
  setVerified: Dispatch<SetStateAction<boolean>>;
}>({
  action: () => {
    return;
  },
  requiresVerification: false,
  verified: false,
  setVerified: () => {
    return;
  },
});

const DestructiveAction = ({
  action,
  requiresVerification = false,
  ...rest
}: AlertDialogPrimitive.AlertDialogProps & {
  action: () => void;
  requiresVerification?: boolean;
}) => {
  const [verified, setVerified] = useState(!requiresVerification);

  return (
    <DestructiveActionContext.Provider
      value={{ action, requiresVerification, verified, setVerified }}
    >
      <AlertDialog {...rest} />
    </DestructiveActionContext.Provider>
  );
};

const DestructiveActionConfirm = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ ...props }, ref) => {
  const { action, requiresVerification, verified } = useContext(
    DestructiveActionContext,
  );

  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      {...props}
      onClick={action}
      disabled={requiresVerification && !verified}
    />
  );
});
DestructiveActionConfirm.displayName = "DestructiveActionConfirm";

const DestructiveActionVerificationTypeIn = forwardRef<
  HTMLInputElement,
  Omit<InputProps, "onChange" | "value"> & { phrase: string }
>(({ phrase, ...rest }, ref) => {
  const [state, setState] = useState("");

  const { setVerified } = useContext(DestructiveActionContext);

  useEffect(() => {
    if (state === phrase) setVerified(true);
    else setVerified(false);
  }, [phrase, setVerified, state]);

  return (
    <Input
      ref={ref}
      {...rest}
      value={state}
      placeholder={phrase}
      onChange={(e) => setState(e.target.value)}
    />
  );
});
DestructiveActionVerificationTypeIn.displayName =
  "DestructiveActionVerificationTypeIn";

const DestructiveActionCancel = AlertDialogCancel;
const DestructiveActionTrigger = AlertDialogTrigger;
const DestructiveActionContent = AlertDialogContent;
const DestructiveActionHeader = AlertDialogHeader;
const DestructiveActionTitle = AlertDialogTitle;
const DestructiveActionDescription = AlertDialogDescription;
const DestructiveActionFooter = AlertDialogFooter;
const DestructiveActionOverlay = AlertDialogOverlay;
const DestructiveActionPortal = AlertDialogPortal;

export {
  DestructiveAction,
  DestructiveActionCancel,
  DestructiveActionConfirm,
  DestructiveActionContent,
  DestructiveActionDescription,
  DestructiveActionFooter,
  DestructiveActionHeader,
  DestructiveActionOverlay,
  DestructiveActionPortal,
  DestructiveActionTitle,
  DestructiveActionTrigger,
  DestructiveActionVerificationTypeIn,
};
