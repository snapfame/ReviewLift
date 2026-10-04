import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBusiness } from "@/hooks/use-business";
import { supabase } from "@/integrations/supabase/client";
import type { BusinessService, ServiceCategory } from "@/lib/business";

export const Route = createFileRoute("/dashboard/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const { business } = useBusiness();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<BusinessService[]>([]);

  const reload = async () => {
    if (!business) return;
    const [{ data: cats }, { data: svcs }] = await Promise.all([
      supabase.from("service_categories").select("*").eq("business_id", business.id).order("sort_order"),
      supabase.from("business_services").select("*").eq("business_id", business.id).order("sort_order"),
    ]);
    setCategories(cats ?? []);
    setServices(svcs ?? []);
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id]);

  if (!business) return null;

  const addCategory = async () => {
    const { error } = await supabase.from("service_categories").insert({
      business_id: business.id,
      name: "New category",
      sort_order: categories.length + 1,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Category added");
      await reload();
    }
  };

  const saveCategory = async (id: string, patch: Partial<ServiceCategory>) => {
    const { error } = await supabase.from("service_categories").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Saved");
    await reload();
  };

  const addService = async (categoryId: string) => {
    const { error } = await supabase.from("business_services").insert({
      business_id: business.id,
      category_id: categoryId,
      name: "New service",
      sort_order: services.filter((s) => s.category_id === categoryId).length + 1,
      vocabulary: ["service", "quality"],
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Service added");
      await reload();
    }
  };

  const saveService = async (id: string, patch: Partial<BusinessService>) => {
    const { error } = await supabase.from("business_services").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Saved");
    await reload();
  };

  const move = async (list: { id: string; sort_order: number }[], id: string, dir: -1 | 1, table: "service_categories" | "business_services") => {
    const index = list.findIndex((item) => item.id === id);
    const swap = list[index + dir];
    if (!swap || index < 0) return;
    const current = list[index]!;
    await supabase.from(table).update({ sort_order: swap.sort_order }).eq("id", current.id);
    await supabase.from(table).update({ sort_order: current.sort_order }).eq("id", swap.id);
    await reload();
  };

  return (
    <div>
      <PageHeader title="Services" description="The public review page reads this list live. No code changes needed.">
        <Button onClick={() => void addCategory()}>Create category</Button>
      </PageHeader>
      <div className="space-y-4">
        {categories.map((category, index) => (
          <div key={category.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                defaultValue={category.name}
                onBlur={(e) => {
                  if (e.target.value.trim() !== category.name) void saveCategory(category.id, { name: e.target.value.trim() });
                }}
                aria-label="Category name"
              />
              <Button size="sm" variant="outline" onClick={() => void move(categories, category.id, -1, "service_categories")} disabled={index === 0}>
                Up
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void move(categories, category.id, 1, "service_categories")}
                disabled={index === categories.length - 1}
              >
                Down
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void saveCategory(category.id, { active: !category.active })}
              >
                {category.active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  const { error } = await supabase.from("service_categories").delete().eq("id", category.id);
                  if (error) toast.error(error.message);
                  else toast.success("Category removed");
                  await reload();
                }}
              >
                Delete
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {services
                .filter((service) => service.category_id === category.id)
                .map((service, sIndex, list) => (
                  <div key={service.id} className="flex flex-wrap items-center gap-2">
                    <Input
                      defaultValue={service.name}
                      onBlur={(e) => {
                        if (e.target.value.trim() !== service.name) void saveService(service.id, { name: e.target.value.trim() });
                      }}
                      aria-label="Service name"
                    />
                    <select
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                      value={service.category_id ?? ""}
                      onChange={(e) => void saveService(service.id, { category_id: e.target.value })}
                      aria-label="Move to category"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" variant="outline" onClick={() => void move(list, service.id, -1, "business_services")} disabled={sIndex === 0}>
                      Up
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void move(list, service.id, 1, "business_services")}
                      disabled={sIndex === list.length - 1}
                    >
                      Down
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void saveService(service.id, { active: !service.active })}>
                      {service.active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        const { error } = await supabase.from("business_services").delete().eq("id", service.id);
                        if (error) toast.error("Could not delete — it may be referenced by sessions. Disable it instead.");
                        else toast.success("Service deleted");
                        await reload();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              <Button size="sm" variant="outline" onClick={() => void addService(category.id)}>
                Create service
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
