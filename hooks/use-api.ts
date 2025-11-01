import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createApiClient, ApiClient } from "@/lib/api";

export function useApi() {
  const { getToken } = useAuth();
  const [api, setApi] = useState<ApiClient | null>(null);

  useEffect(() => {
    const initApi = async () => {
      const token = await getToken();
      setApi(createApiClient(token || undefined));
    };
    initApi();
  }, [getToken]);

  return api;
}

