import { getSEOTags } from "@/lib/seo";

export const metadata = getSEOTags({
  title: `Dashboard | Data Traffic App`,
  canonicalUrlRelative: "/dashboard",
});

export default function Layout({ children }) {
  return <>{children}</>;
}
