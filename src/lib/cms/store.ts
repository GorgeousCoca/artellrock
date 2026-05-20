import { promises as fs } from "fs";
import path from "path";

import defaultStore from "@/content/default-store.json";
import type {
  BlogCategory,
  BlogPost,
  CmsStore,
  CompanySettings,
  ContactRequest,
  Product,
  Project,
  StoneSample
} from "@/types/content";
import { uid } from "@/lib/utils";

const STORE_PATH = path.join(process.cwd(), "src", "content", "cms-store.json");

async function ensureStoreDir() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
}

export async function readStore(): Promise<CmsStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as CmsStore;
  } catch {
    return structuredClone(defaultStore) as CmsStore;
  }
}

async function writeStore(store: CmsStore) {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

type CollectionKey =
  | "products"
  | "stoneSamples"
  | "projects"
  | "blogCategories"
  | "blogPosts"
  | "teamMembers"
  | "testimonials"
  | "certificates"
  | "contactRequests";

type CollectionMap = {
  products: Product;
  stoneSamples: StoneSample;
  projects: Project;
  blogCategories: BlogCategory;
  blogPosts: BlogPost;
  teamMembers: CmsStore["teamMembers"][number];
  testimonials: CmsStore["testimonials"][number];
  certificates: CmsStore["certificates"][number];
  contactRequests: ContactRequest;
};

export async function listCollection<K extends CollectionKey>(key: K): Promise<CollectionMap[K][]> {
  const store = await readStore();
  return store[key] as CollectionMap[K][];
}

export async function getBySlug<K extends "products" | "stoneSamples" | "projects" | "blogPosts">(
  key: K,
  slug: string
) {
  const items = await listCollection(key);
  return items.find((item) => item.slug === slug) ?? null;
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const store = await readStore();
  return store.companySettings;
}

export async function updateCompanySettings(payload: CompanySettings) {
  const store = await readStore();
  store.companySettings = payload;
  await writeStore(store);
  return payload;
}

export async function createContactRequest(input: Omit<ContactRequest, "id" | "createdAt">) {
  const store = await readStore();
  const request: ContactRequest = {
    ...input,
    id: uid("lead"),
    createdAt: new Date().toISOString()
  };
  store.contactRequests.unshift(request);
  await writeStore(store);
  return request;
}

export async function createItem<K extends CollectionKey>(
  key: K,
  item: Omit<CollectionMap[K], "id"> & Partial<Pick<CollectionMap[K], "id">>
) {
  const store = await readStore();
  const nextItem = {
    ...item,
    id: item.id ?? uid(key)
  } as CollectionMap[K];
  const collection = store[key] as CollectionMap[K][];
  collection.unshift(nextItem);
  await writeStore(store);
  return nextItem;
}

export async function updateItem<K extends CollectionKey>(key: K, id: string, updates: Partial<CollectionMap[K]>) {
  const store = await readStore();
  const collection = store[key] as CollectionMap[K][];
  const index = collection.findIndex((item: CollectionMap[K] & { id: string }) => item.id === id);

  if (index === -1) {
    throw new Error("Item not found");
  }

  collection[index] = {
    ...collection[index],
    ...updates
  };

  await writeStore(store);
  return collection[index];
}

export async function deleteItem<K extends CollectionKey>(key: K, id: string) {
  const store = await readStore();
  const collection = store[key] as CollectionMap[K][];
  const nextCollection = collection.filter((item: CollectionMap[K] & { id: string }) => item.id !== id);
  (store[key] as CollectionMap[K][]) = nextCollection;
  await writeStore(store);
}
