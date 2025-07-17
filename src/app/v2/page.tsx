import { app } from "@/config/meta";

import UserSpacesGrid from "@/components/pages/landing-page/user-spaces-grid";
import { Separator } from "@/components/ui/separator";

export default function testPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6 pt-32 --orange-500">
      <div className="mb-12 text-center">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">
          Welcome <span className="text-indigo-600">gc</span>!
        </h1>
        <p className="text-xl text-gray-600">to the {app.descriptor}</p>
      </div>
      <Separator className="my-4 w-1/3" />
      <UserSpacesGrid />
      <div className="h-20">&nbsp;</div>
    </div>
  );
}
