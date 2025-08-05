import { type AlgorithmDTO, type InstanceDTO } from "@/dto";
import { AlgorithmRunResult } from "@/dto/result/algorithm-run-result";

import { Transformers as T } from "@/db/transformers";
import { type DB } from "@/db/types";

import {
  type IMatchingService,
  MatchingServiceError,
  type MatchingServiceResponse,
} from "@/lib/services/matching";
import { expand, toAlgID } from "@/lib/utils/general/instance-params";
import {
  type MatchingResultDTO,
  type MatchingDataDTO,
  blankResult,
} from "@/lib/validations/matching";
import { type AlgorithmInstanceParams } from "@/lib/validations/params";

import { DataObject } from "./data-object";

export class MatchingAlgorithm extends DataObject {
  public params: AlgorithmInstanceParams;

  private _config: AlgorithmDTO | undefined;
  private _instance: InstanceDTO | undefined;
  private _results: MatchingResultDTO | undefined;

  constructor(
    db: DB,
    params: AlgorithmInstanceParams,
    private matchingService: IMatchingService,
  ) {
    super(db);
    this.params = params;
  }

  public async get(): Promise<AlgorithmDTO> {
    this._config ??= await this.db.algorithm
      .findFirstOrThrow({ where: { id: this.params.algConfigId } })
      .then((x) => T.toAlgorithmDTO(x));
    return this._config!;
  }

  public async getInstance(): Promise<InstanceDTO> {
    this._instance ??= await this.db.allocationInstance
      .findFirstOrThrow({ where: expand(this.params) })
      .then((x) => T.toAllocationInstanceDTO(x));
    return this._instance!;
  }

  public async run(matchingData: MatchingDataDTO): Promise<AlgorithmRunResult> {
    const algorithm = await this.get();

    try {
      const serviceResponse = await this.matchingService.executeAlgorithm(
        algorithm,
        matchingData,
      );

      if (serviceResponse.status !== AlgorithmRunResult.OK) {
        return serviceResponse.status;
      }

      const { data } = serviceResponse;
      if (!data) {
        throw new Error("No data returned from algorithm");
      }

      await this.processAndPersistResults(data);

      return AlgorithmRunResult.OK;
    } catch (error) {
      if (error instanceof MatchingServiceError) {
        console.error(
          `[MatchingAlgorithm] Service error: ${error.message}`,
          error,
        );
        return AlgorithmRunResult.ERR;
      }
      throw error;
    }
  }

  private async processAndPersistResults(
    data: NonNullable<MatchingServiceResponse["data"]>,
  ) {
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
        where: { matchingResult: { algorithm: toAlgID(this.params) } },
      }),

      this.db.matchingResult.upsert({
        where: toAlgID(this.params),
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
  }

  /**
   *
   * @throws if the function is called before the results are computed
   */
  public async getResults(): Promise<MatchingResultDTO> {
    this._results ??= await this.db.matchingResult
      .findFirstOrThrow({
        where: { algorithmId: this.params.algConfigId, ...expand(this.params) },
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
    return this._results!;
  }

  public async getMatching(): Promise<MatchingResultDTO> {
    const res = await this.db.matchingResult.findFirst({
      where: { algorithmId: this.params.algConfigId, ...expand(this.params) },
      include: { matching: true },
    });

    return res ?? blankResult;
  }

  public async delete(): Promise<void> {
    await this.db.algorithm.delete({ where: { id: this.params.algConfigId } });
  }
}
