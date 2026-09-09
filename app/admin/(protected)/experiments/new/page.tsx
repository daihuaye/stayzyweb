import { Wizard } from "@/components/admin/wizard";
export const metadata = {
  title: "Create flight",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <Wizard />;
}
