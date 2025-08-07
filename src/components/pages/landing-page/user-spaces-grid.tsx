import { Settings, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { api } from "@/lib/trpc/server";

import { InstanceCard } from "./instance-card";

export default async function UserSpacesGrid() {
  const instances = await api.user.getInstances();
  const adminPanels = await api.user.getAdminPanels();

  return (
    <>
      <div className="space-y-8">
        {instances.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">
              Your Instances
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {instances.map((instance) => (
                <Link
                  href={`/${instance.group.id}/${instance.subGroup.id}/${instance.instance.id}`}
                  key={instance.instance.id}
                >
                  <InstanceCard instanceData={instance} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {adminPanels.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">
              Admin Panels
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {adminPanels.map((panel) => (
                <Link href={panel.path} key={panel.path}>
                  <Card className="group cursor-pointer border-l-4 border-l-orange-500 transition-shadow hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4 text-orange-600" />
                        <CardTitle className="text-lg">
                          {panel.displayName}
                        </CardTitle>
                      </div>
                      {panel.group && panel.subGroup && (
                        <div className="space-y-2 text-sm text-gray-600">
                          <div>{panel.group.displayName}</div>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="mt-4 flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          className="transition-colors group-hover:bg-orange-600 group-hover:text-white"
                        >
                          Open Admin Panel
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {instances.length === 0 && adminPanels.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-400">
              <Users className="mx-auto h-16 w-16" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No instances available
            </h3>
            <p className="text-gray-600">
              Contact the Project Coordinators to get access to instances
              panels.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
