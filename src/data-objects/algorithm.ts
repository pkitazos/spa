import { expand, toAlgCIIID } from "@/lib/utils/general/instance-params";
import { AlgorithmDTO } from "@/lib/validations/algorithm";
import { MatchingDataDTO, MatchingResultDTO } from "@/lib/validations/matching";
import { AlgorithmInstanceParams } from "@/lib/validations/params";

import { executeMatchingAlgorithm } from "@/server/routers/institution/instance/algorithm/_utils/execute-matching-algorithm";

import { DataObject } from "./data-object";

import { allocationInstanceToDTO } from "@/db/transformers";
import { DB } from "@/db/types";
import { InstanceDTO } from "@/dto";
import { AlgorithmRunResult } from "@/dto/algorithm-run-result";

export class MatchingAlgorithm extends DataObject {
  public params: AlgorithmInstanceParams;

  private _config: AlgorithmDTO | undefined;
  private _instance: InstanceDTO | undefined;
  private _results: MatchingResultDTO | undefined;

  constructor(db: DB, params: AlgorithmInstanceParams) {
    super(db);
    this.params = params;
  }

  public async getConfig(): Promise<AlgorithmDTO> {
    if (!this._config) {
      this._config = await this.db.algorithmConfig
        .findFirstOrThrow({ where: { id: this.params.algConfigId } })
        .then((x) => ({
          id: x.id,
          displayName: x.displayName,
          description: x.description ?? undefined,
          flag1: x.flag1,
          flag2: x.flag2 ?? undefined,
          flag3: x.flag3 ?? undefined,
          targetModifier: x.targetModifier,
          upperBoundModifier: x.upperBoundModifier,
          maxRank: x.maxRank,
        }));
    }
    return this._config!;
  }

  public async getInstance(): Promise<InstanceDTO> {
    if (!this._instance) {
      this._instance = await this.db.allocationInstance
        .findFirstOrThrow({ where: expand(this.params) })
        .then(allocationInstanceToDTO);
    }
    return this._instance!;
  }

  public async run(
    matchingData: MatchingDataDTO,
  ): Promise<{ total: number; matched: number }> {
    const alg = await this.getConfig();
    const res = await executeMatchingAlgorithm(alg, matchingData);

    if (res.status === AlgorithmRunResult.OK) {
      const data = res.data.data!; // TODO: idk how discriminated unions work @JakeTrevor

      const matchingResult = {
        profile: data.profile,
        degree: data.degree,
        size: data.size,
        weight: data.weight,
        cost: data.cost,
        costSq: data.costSq,
        maxLecAbsDiff: data.maxLecAbsDiff,
        sumLecAbsDiff: data.sumLecAbsDiff,
        ranks: data.ranks,
      };

      const matchingPairs = data.matching
        .filter((x) => x.project_id !== "0")
        .map((x) => ({
          ...expand(this.params),
          userId: x.student_id,
          projectId: x.project_id,
          studentRanking: x.preference_rank,
        }));

      // @JakeTrevor Could make this a non-interactive transaction by adding the algorithmConfigId to the MatchingPairs
      await this.db.$transaction(async (tx) => {
        const { id: matchingResultId } = await tx.matchingResult.upsert({
          where: { algConfigInInstanceId: toAlgCIIID(this.params) },
          update: matchingResult,
          create: { ...toAlgCIIID(this.params), ...matchingResult },
        });

        await tx.matchingPair.deleteMany({ where: { matchingResultId } });

        await tx.matchingPair.createMany({
          data: matchingPairs.map((x) => ({ ...x, matchingResultId })),
        });
      });

      return {
        total: matchingData.students.length,
        matched: matchingPairs.length,
      };
    }

    throw new Error(`Matching algorithm failed: ${res.error}`);
  }

  /**
   *
   * @throws if the function is called before the results are computed
   */
  public async getResults(): Promise<MatchingResultDTO> {
    if (!this._results) {
      this._results = await this.db.matchingResult
        .findFirstOrThrow({
          where: {
            algConfigId: this.params.algConfigId,
            ...expand(this.params),
          },
          include: { matching: true },
        })
        .then((x) => ({
          profile: x.profile,
          degree: x.degree,
          size: x.size,
          weight: x.weight,
          cost: x.cost,
          costSq: x.costSq,
          maxLecAbsDiff: x.maxLecAbsDiff,
          sumLecAbsDiff: x.sumLecAbsDiff,
          ranks: x.ranks,
          matching: x.matching,
        }));
    }
    return this._results!;
  }
}
