import { type ReactNode } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";

import { SiteHeader } from "./site-header";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        {children}
      </SidebarProvider>
    </div>
  );
}

//  <div className="flex flex-1">
//           <AppSidebar />
//           <SidebarInset>
//             <div className="absolute flex flex-1 w-full flex-col gap-4 p-4 top-[calc(var(--header-height)-1px)]">
//               {children}
//             </div>
//           </SidebarInset>
//         </div>
