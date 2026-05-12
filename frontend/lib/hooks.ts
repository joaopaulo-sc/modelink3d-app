import useSWR from "swr";
import { api } from "./api";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export const useOrders = (status?: string) =>
  useSWR(`/orders${status ? `?status=${status}` : ""}`, fetcher);

export const useOrder = (id?: number) =>
  useSWR(id ? `/orders/${id}` : null, fetcher);

export const useClients = () => useSWR("/clients", fetcher);

export const usePrinters = () => useSWR("/printers", fetcher);

export const useMaterials = () => useSWR("/materials", fetcher);

export const useExtraServices = () => useSWR("/extra-services", fetcher);

export const useStock = () => useSWR("/stock", fetcher);

export const useSettings = () => useSWR("/settings", fetcher);

export const useCatalog = () => useSWR("/catalog", fetcher);
