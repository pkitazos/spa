import { InstanceParams } from "@/lib/validations/params";

import { DB } from "@/db/types";
import { Marker } from "./marker";
import { expand } from "@/lib/utils/general/instance-params";
import { Transformers as T } from "@/db/transformers";
import { ProjectDTO, StudentDTO } from "@/dto";

export class Reader extends Marker {
  constructor(db: DB, id: string, params: InstanceParams) {
    super(db, id, params);
  }

  public async getAllocations(): Promise<
    { project: ProjectDTO; student: StudentDTO }[]
  > {
    const data = await this.db.readerProjectAllocation.findMany({
      where: { ...expand(this.instance.params), readerId: this.id },
      include: {
        student: {
          include: {
            userInInstance: { include: { user: true } },
            studentFlags: {
              include: { flag: { include: { gradedSubmissions: true } } },
            },
          },
        },
        project: {
          include: {
            flagsOnProject: { include: { flag: true } },
            tagsOnProject: { include: { tag: true } },
          },
        },
      },
    });

    return data.map((a) => ({
      project: T.toProjectDTO(a.project),
      student: T.toStudentDTO(a.student),
    }));
  }
}
