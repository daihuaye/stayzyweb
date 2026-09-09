import { Dashboard } from "@/components/admin/dashboard";
export const metadata = {
  title: "Feature flights",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <Dashboard />;
}
