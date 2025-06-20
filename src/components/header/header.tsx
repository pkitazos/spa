import Image from "next/image";
import Link from "next/link";

import { InstanceHeader } from "./instance-header";
import { RolePicker } from "./role-picker";
import { env } from "@/env";
import { UserButton } from "./user-button";

export async function Header() {
  return (
    <nav className="sticky top-0 z-50 flex h-[8dvh] max-h-[5rem] w-full items-center justify-between gap-6 bg-primary px-10 py-5 shadow-md">
      <Link className="basis-1/4" href="/">
        <Image
          className="max-w-[10rem] object-scale-down"
          width={300}
          height={100}
          src="/uofg-white.png"
          alt=""
        />
      </Link>
      <div className="flex w-full flex-grow justify-between">
        <InstanceHeader />
      </div>
      <div className="flex basis-1/4 items-center justify-end gap-4">
        {env.DEV_ENV === "PROD" ? <UserButton /> : <RolePicker />}
      </div>
    </nav>
  );
}
