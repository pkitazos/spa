import { SidebarProvider } from "@/components/ui/sidebar";

import { MainContentPanel } from "./_components/main-content-panel";
import { SidePanel } from "./_components/side-panel";

// TODO: this is gonna break stuff when we add the second sidebar for sure
export default async function Page() {
  return (
    <SidebarProvider className="relative ">
      <div className="flex">
        <SidePanel />
        <MainContentPanel />
      </div>
    </SidebarProvider>
  );
}
