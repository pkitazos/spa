import { getStageLabel } from "@/config/stages";

import { getRoleDisplayName, type Role, type Stage } from "@/db/types";

import { type AccessControlContext, DenialReason } from "./types";

// MOVE these to some other file if you think they might be useful to you
function FancyStage({ stage }: { stage: Stage }) {
  return (
    <span className="font-mono bg-accent p-0.5 rounded-xs text-accent-foreground">
      {getStageLabel(stage)}
    </span>
  );
}

function FancyRole({ role }: { role: Role }) {
  return (
    <span className="font-mono bg-accent p-0.5 rounded-xs text-accent-foreground">
      {getRoleDisplayName(role)}
    </span>
  );
}

export function FormatDenial({
  ctx,
  reason,
}: {
  ctx: AccessControlContext;
  reason: DenialReason;
}) {
  switch (reason.code) {
    case DenialReason.BAD_ROLE:
      return (
        <p>
          Restricted to roles:{" "}
          {reason.allowedRoles.map((role, i, arr) => (
            <>
              <FancyRole role={role} key={i} />
              {i === arr.length - 1 ? "" : ", "}
            </>
          ))}
          .<br />
          Your roles:{" "}
          {ctx.userRoles.map((role, i, arr) => (
            <>
              <FancyRole role={role} key={i} />
              {i === arr.length - 1 ? "" : ", "}
            </>
          ))}
        </p>
      );

    case DenialReason.BAD_STAGE:
      return (
        <p>
          Restricted to stages:{" "}
          {reason.allowedStages.map((stage, i, arr) => (
            <>
              <FancyStage stage={stage} key={i} />
              {i === arr.length - 1 ? "" : ", "}
            </>
          ))}
          <br />
          Current stage: <FancyStage stage={ctx.currentStage} />.
        </p>
      );

    default:
      return <p>Access condition not met</p>;
  }
}

export function FormatDenials({
  ctx,
  reasons,
  action,
}: {
  ctx: AccessControlContext;
  reasons: DenialReason[];
  action?: string;
}) {
  return (
    <p className="max-w-xl">
      {action && (
        <>
          <b className="font-medium">{action}</b> is currently disallowed.
          <br />
        </>
      )}
      {reasons.map((reason, i) => (
        <FormatDenial key={i} ctx={ctx} reason={reason} />
      ))}
    </p>
  );
}
