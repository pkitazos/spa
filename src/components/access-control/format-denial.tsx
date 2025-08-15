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
          Access restricted to roles:{" "}
          {reason.allowedRoles.map((role, i, arr) => (
            <>
              <FancyRole role={role} key={i} />
              {i === arr.length ? "" : ", "}
            </>
          ))}
          . Your roles:{" "}
          {ctx.userRoles.map((role, i, arr) => (
            <>
              <FancyRole role={role} key={i} />
              {i === arr.length ? "" : ", "}
            </>
          ))}
        </p>
      );

    case DenialReason.BAD_STAGE:
      return (
        <p>
          Access not available in current stage:{" "}
          <FancyStage stage={ctx.currentStage} />. Available in:{" "}
          {reason.allowedStages.map((stage, i, arr) => (
            <>
              <FancyStage stage={stage} key={i} />
              {i === arr.length - 1 ? "" : ", "}
            </>
          ))}
        </p>
      );

    default:
      return <p>Access condition not met</p>;
  }
}

export function FormatDenials({
  ctx,
  reasons,
}: {
  ctx: AccessControlContext;
  reasons: DenialReason[];
}) {
  return (
    <p className="max-w-xl">
      {reasons.map((reason, i) => (
        <FormatDenial key={i} ctx={ctx} reason={reason} />
      ))}
    </p>
  );
}
