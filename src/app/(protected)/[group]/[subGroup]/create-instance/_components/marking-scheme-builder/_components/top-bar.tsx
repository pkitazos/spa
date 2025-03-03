import { Download, HelpCircle, PlusCircle, Save, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <div className="flex items-center justify-between border-b p-4">
      <h1 className="text-2xl font-bold">Marking Scheme Builder</h1>
      <div className="flex space-x-2">
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Schema
        </Button>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Import JSON
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export JSON
        </Button>
        <Button variant="outline">
          <HelpCircle className="mr-2 h-4 w-4" /> Quick Start Guide
        </Button>
        <Button variant="default" disabled>
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
