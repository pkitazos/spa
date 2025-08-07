import { PanelWrapper } from "@/components/panel-wrapper";
import { InstanceHomeRedirectButton } from "@/components/params-context";

export default async function NotFound() {
  return (
    <PanelWrapper className="flex h-full flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-4xl">
          Oops, page not found!
        </h1>
        <p className="mt-4 text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6">
          <InstanceHomeRedirectButton />
        </div>
      </div>
    </PanelWrapper>
  );
}
