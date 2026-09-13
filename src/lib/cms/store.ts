import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CMS_DEFINITIONS, definitionByKey, itemTemplate, type CmsDefinition } from "@/lib/cms/catalog";
import { defaultWebsiteContent } from "@/lib/site-defaults";

export type CmsRecord = {
  key: string;
  kind: string;
  parentKey: string | null;
  label: string;
  placement: string;
  groupName: string;
  sortOrder: number;
  enabled: boolean;
  data: Record<string, string>;
  fields: CmsDefinition["fields"];
  itemFields?: CmsDefinition["fields"];
};

function asData(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, item == null ? "" : String(item)]),
  );
}

function definitionRecord(definition: CmsDefinition, overlay?: Record<string, string>): CmsRecord {
  return {
    key: definition.key,
    kind: definition.kind,
    parentKey: definition.parentKey ?? null,
    label: definition.label,
    placement: definition.placement,
    groupName: definition.groupName,
    sortOrder: definition.sortOrder,
    enabled: definition.enabled,
    data: { ...definition.data, ...overlay },
    fields: definition.fields,
    itemFields: definition.itemFields,
  };
}

function fallbackRecords() {
  return CMS_DEFINITIONS.map((definition) => definitionRecord(definition));
}

function legacyOverlay(key: string, content: Record<string, { markdown: string }>) {
  if (key === "home.hero") {
    const title = content["home.hero.title"]?.markdown;
    const lines = title?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
    return {
      ...(content["home.hero.badge"] ? { badge: content["home.hero.badge"].markdown } : {}),
      ...(lines[0] ? { titleLine1: lines[0] } : {}),
      ...(lines[1] ? { titleLine2: lines[1] } : {}),
    };
  }
  if (key === "site.settings" && content["site.footer.description"]) {
    return { footerDescription: content["site.footer.description"].markdown };
  }
  if (key === "learn.explore") {
    return {
      ...(content["learn.explore.badge"] ? { badge: content["learn.explore.badge"].markdown } : {}),
      ...(content["learn.explore.title"] ? { title: content["learn.explore.title"].markdown } : {}),
      ...(content["learn.explore.description"] ? { description: content["learn.explore.description"].markdown } : {}),
    };
  }
  if (key === "dashboard.hero") {
    return {
      ...(content["dashboard.hero.badge"] ? { badge: content["dashboard.hero.badge"].markdown } : {}),
      ...(content["dashboard.hero.title"] ? { title: content["dashboard.hero.title"].markdown } : {}),
      ...(content["dashboard.hero.description"] ? { description: content["dashboard.hero.description"].markdown } : {}),
    };
  }
  return {};
}

async function legacyContent() {
  try {
    const rows = await prisma.websiteContent.findMany({ where: { locale: "en" } });
    return Object.fromEntries(rows.map((row) => [row.key, { markdown: row.markdown }]));
  } catch {
    return Object.fromEntries(
      Object.entries(defaultWebsiteContent).map(([key, value]) => [key, { markdown: value.markdown }]),
    );
  }
}

export async function ensureCmsSeeded(userId?: string) {
  const existing = await prisma.cmsEntry.findMany({ select: { key: true } });
  const have = new Set(existing.map((row) => row.key));
  const missing = CMS_DEFINITIONS.filter((definition) => !have.has(definition.key));
  if (!missing.length) return;

  const content = await legacyContent();
  await prisma.cmsEntry.createMany({
    data: missing.map((definition) => ({
      kind: definition.kind,
      key: definition.key,
      parentKey: definition.parentKey,
      label: definition.label,
      placement: definition.placement,
      groupName: definition.groupName,
      sortOrder: definition.sortOrder,
      enabled: definition.enabled,
      status: "PUBLISHED" as const,
      data: { ...definition.data, ...legacyOverlay(definition.key, content) },
      updatedById: userId,
    })),
    skipDuplicates: true,
  });
}

function decorate(row: {
  key: string;
  kind: string;
  parentKey: string | null;
  label: string;
  placement: string;
  groupName: string;
  sortOrder: number;
  enabled: boolean;
  data: Prisma.JsonValue;
}): CmsRecord {
  const definition = definitionByKey(row.key);
  const parent = row.parentKey ? definitionByKey(row.parentKey) : undefined;
  return {
    key: row.key,
    kind: row.kind,
    parentKey: row.parentKey,
    label: row.label,
    placement: row.placement,
    groupName: row.groupName,
    sortOrder: row.sortOrder,
    enabled: row.enabled,
    data: asData(row.data),
    fields: definition?.fields ?? parent?.itemFields ?? itemTemplate(row.parentKey ?? ""),
    itemFields: definition?.itemFields,
  };
}

export async function listCmsRecords(): Promise<CmsRecord[]> {
  try {
    await ensureCmsSeeded();
    const rows = await prisma.cmsEntry.findMany({ orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }, { key: "asc" }] });
    const byKey = new Map(rows.map((row) => [row.key, decorate(row)]));
    for (const definition of CMS_DEFINITIONS) {
      if (!byKey.has(definition.key)) byKey.set(definition.key, definitionRecord(definition));
    }
    return [...byKey.values()].sort((a, b) => a.groupName.localeCompare(b.groupName) || a.sortOrder - b.sortOrder);
  } catch (error) {
    console.error("CMS unavailable, using built-in content:", error);
    return fallbackRecords();
  }
}

export async function saveCmsRecords(
  input: Array<{ key: string; enabled: boolean; data: Record<string, string>; sortOrder?: number; label?: string }>,
  userId: string,
) {
  await ensureCmsSeeded(userId);
  for (const entry of input) {
    const current = await prisma.cmsEntry.findUnique({ where: { key_locale: { key: entry.key, locale: "en" } } });
    if (!current) continue;
    if (current.kind !== "item" && definitionByKey(entry.key) == null) continue;
    await prisma.cmsEntry.update({
      where: { id: current.id },
      data: {
        enabled: entry.enabled,
        data: entry.data,
        sortOrder: entry.sortOrder ?? current.sortOrder,
        label: entry.label?.trim() || current.label,
        status: "PUBLISHED",
        updatedById: userId,
      },
    });
  }
}

export async function createCmsItem(parentKey: string, userId: string) {
  const fields = itemTemplate(parentKey);
  const parent = await prisma.cmsEntry.findUnique({ where: { key_locale: { key: parentKey, locale: "en" } } });
  if (!parent || !fields.length) {
    throw new Error("This section does not accept extra items.");
  }
  const count = await prisma.cmsEntry.count({ where: { parentKey } });
  const key = `${parentKey}.custom.${crypto.randomUUID()}`;
  const data = Object.fromEntries(fields.map((field) => [field.key, ""]));
  return prisma.cmsEntry.create({
    data: {
      kind: "item",
      key,
      parentKey,
      label: "New item",
      placement: parent.placement,
      groupName: parent.groupName,
      sortOrder: count + 1,
      enabled: true,
      status: "PUBLISHED",
      data,
      updatedById: userId,
    },
  });
}

export async function deleteCmsItem(key: string) {
  const current = await prisma.cmsEntry.findUnique({ where: { key_locale: { key, locale: "en" } } });
  if (!current || current.kind !== "item" || !current.key.includes(".custom.")) {
    throw new Error("Only items you added can be deleted. Turn a built-in item off instead.");
  }
  await prisma.cmsEntry.delete({ where: { id: current.id } });
}
