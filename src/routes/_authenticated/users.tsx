import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/hire/app-shell";
import { LoadingRows, PageHeader, Panel, StatusBadge } from "@/components/hire/bits";
import { DataTable, Td } from "@/components/hire/table";
import { profilesQuery, userRolesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Users — HireFlow AI" },
      { name: "description", content: "People with access to HireFlow AI and their roles." },
      { property: "og:title", content: "Users — HireFlow AI" },
      { property: "og:description", content: "People with access to HireFlow AI and their roles." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const profiles = useQuery(profilesQuery());
  const roles = useQuery(userRolesQuery());
  return (
    <AppShell breadcrumbs={[{ label: "Users" }]}>
      <PageHeader title="Users" subtitle="Roles are stored separately and checked on the server." />
      <Panel>
        {profiles.isLoading ? <LoadingRows /> : (
          <DataTable head={["Name", "Email", "Department", "Role", "Status"]}>
            {(profiles.data ?? []).map((p) => <tr key={p.id}><Td>{p.name}</Td><Td>{p.email}</Td><Td>{p.department ?? "—"}</Td><Td>{roles.data?.filter((r) => r.user_id === p.id).map((r) => r.role).join(", ") || "—"}</Td><Td><StatusBadge status={p.status} /></Td></tr>)}
          </DataTable>
        )}
      </Panel>
    </AppShell>
  );
}
