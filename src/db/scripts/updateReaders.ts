import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";
import { MarkerType, PrismaClient } from "@prisma/client";
import { read } from "fs";

async function updateReaders(params: InstanceParams, db: PrismaClient) {
  const updatedAllocations = [
    {
      projectTitle: "Image caption generator",
      supervisorName: "Chris McCaig",
      readerName: "Matthew Chalmers",
    },
    {
      projectTitle: "Federated Learning for Osteoporosis Diagnosis",
      supervisorName: "Nguyen Truong",
      readerName: "Chris McCaig",
    },
    {
      projectTitle: "Online Family Tree Builder",
      supervisorName: "Sofiat Olaosebikan",
      readerName: "Nguyen Truong",
    },
    {
      projectTitle: "Re-designing Tamagotchi for modern phones",
      supervisorName: "Matthew Chalmers",
      readerName: "Sofiat Olaosebikan",
    },
  ];

  for (var update of updatedAllocations) {
    let project = await db.project.findFirst({
      where: {
        title: update.projectTitle,
        allocationInstanceId: params.instance,
      },
    });

    if (!project) {
      console.log("Project %s not found", update.projectTitle);
    } else {
      let reader = await db.user.findFirst({
        where: { name: update.readerName },
      });

      if (!reader) {
        console.log("Reader %s not found", update.readerName);
      } else {
        await db.readerProjectAllocation.updateMany({
          where: { projectId: project.id },
          data: { readerId: reader.id },
        });

        let supervisor = await db.user.findFirst({
          where: { name: update.supervisorName },
        });

        if (!supervisor) {
          console.log("Supervisor %s not found", update.supervisorName);
        } else {
          await db.project.update({
            where: { id: project.id },
            data: { supervisorId: supervisor.id },
          });

          console.log(
            "Updated reader project allocation %s in instance %s",
            project.id,
            params.instance,
          );
        }
      }
    }
  }
}
