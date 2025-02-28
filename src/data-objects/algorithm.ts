import { expand, toAlgID } from "@/lib/utils/general/instance-params";
import { AlgorithmDTO } from "@/lib/validations/algorithm";
import { MatchingDataDTO, MatchingResultDTO } from "@/lib/validations/matching";
import { AlgorithmInstanceParams } from "@/lib/validations/params";

import { executeMatchingAlgorithm } from "@/server/routers/institution/instance/algorithm/_utils/execute-matching-algorithm";

import { DataObject } from "./data-object";

import { allocationInstanceToDTO, toAlgorithmDTO } from "@/db/transformers";
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

  public async get(): Promise<AlgorithmDTO> {
    if (!this._config) {
      this._config = await this.db.algorithmConfig
        .findFirstOrThrow({ where: { id: this.params.algConfigId } })
        .then(toAlgorithmDTO);
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

  public async run(matchingData: MatchingDataDTO): Promise<AlgorithmRunResult> {
    const alg = await this.get();
    const res = await executeMatchingAlgorithm(alg, matchingData);

    if (res.status !== AlgorithmRunResult.OK) return res.status;

    const { data } = res;

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

    await this.db.$transaction([
      this.db.matchingPair.deleteMany({
        where: {
          matchingResult: { algorithmConfigInInstance: toAlgID(this.params) },
        },
      }),

      this.db.matchingResult.upsert({
        where: { algConfigInInstanceId: toAlgID(this.params) },
        update: matchingResult,
        create: {
          ...toAlgID(this.params),
          ...matchingResult,
          matching: {
            createMany: { data: matchingPairs, skipDuplicates: true },
          },
        },
      }),
    ]);

    this._results = { ...matchingResult, matching: matchingPairs };

    return AlgorithmRunResult.OK;
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
