import { PrismaClient } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import algs from "./data/Algorithm.json";
import flags from "./data/Flag.json";
import tags from "./data/Tag.json";
import { algorithmFlagSchema } from "@/dto";
import { DB_Algorithm } from "../types";
import { addHours } from "date-fns";

export async function tags_flags_algs(
  db: PrismaClient,
  params: InstanceParams,
) {
  await db.$transaction([
    db.tag.createMany({
      data: tags
        .filter(
          (x) =>
            x.allocation_group_id === params.group &&
            x.allocation_sub_group_id === params.subGroup &&
            x.allocation_instance_id === params.instance,
        )
        .map((x) => ({ id: x.id, title: x.title, ...expand(params) })),
      skipDuplicates: true,
    }),

    db.flag.createMany({
      data: flags
        .filter(
          (x) =>
            x.allocation_group_id === params.group &&
            x.allocation_sub_group_id === params.subGroup &&
            x.allocation_instance_id === params.instance,
        )
        .map((x) => ({
          id: x.id,
          title: x.title,
          ...expand(params),
          description: "",
        })),
      skipDuplicates: true,
    }),

    db.algorithm.createMany({
      data: algs
        .filter(
          (x) =>
            x.allocation_group_id === params.group &&
            x.allocation_sub_group_id === params.subGroup &&
            x.allocation_instance_id === params.instance,
        )
        .map(
          (x, i) =>
            ({
              id: x.alg_name,
              displayName: x.display_name,
              description: x.description,
              flag1: algorithmFlagSchema.parse(x.flag_1),
              flag2: x.flag_2 ? algorithmFlagSchema.parse(x.flag_2) : null,
              flag3: x.flag_3 ? algorithmFlagSchema.parse(x.flag_3) : null,
              maxRank: x.max_rank,
              targetModifier: x.target_modifier,
              upperBoundModifier: x.upper_bound_modifier,
              createdAt: addHours(new Date(), i),
              ...expand(params),
            }) satisfies DB_Algorithm,
        ),
      skipDuplicates: true,
    }),
  ]);
}
