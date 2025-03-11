const timelineItems = [
  {
    id: 1,
    title: "Project Submission",
    description: "Supervisors submit their project proposals",
  },
  {
    id: 2,
    title: "Student Preference Submission",
    description: "Students view projects and submit their preferences",
  },
  {
    id: 3,
    title: "Student Project Allocation",
    description: "System allocates projects to Students based on preferences",
  },
  {
    id: 4,
    title: "Reader Preference Submission",
    description: "Readers submit their preferences for student projects",
  },
  {
    id: 5,
    title: "Reader Project Allocation",
    description: "System allocates projects to Readers based on preferences",
  },
];

export function TimelineSequence() {
  return (
    <div className="pt-4">
      <h2 className="mb-6 text-2xl font-bold">Timeline Sequence</h2>

      <div className="space-y-8">
        {timelineItems.map((item, index) => (
          <div key={item.id} className="relative">
            {index < timelineItems.length - 1 && (
              <div className="absolute left-[14px] top-[32px] h-[calc(100%)] w-[4px] bg-secondary" />
            )}

            <div className="flex items-start">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
                <span className="text-base font-semibold">{item.id}</span>
              </div>

              <div className="ml-4">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
