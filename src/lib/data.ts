import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Song = Database["public"]["Tables"]["songs"]["Row"];
export type SongInput = Database["public"]["Tables"]["songs"]["Insert"];
export type Setlist = Database["public"]["Tables"]["setlists"]["Row"];

export function useSongs() {
  return useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("songs").select("*").order("title");
      if (error) throw error;
      return data;
    },
  });
}

export function useSong(id: string) {
  return useQuery({
    queryKey: ["song", id],
    enabled: id !== "new",
    queryFn: async () => {
      const { data, error } = await supabase.from("songs").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveSong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | undefined; values: SongInput }) => {
      const q = id
        ? supabase.from("songs").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id)
        : supabase.from("songs").insert(values);
      const { data, error } = await q.select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useDeleteSong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("songs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useSetlists() {
  return useQuery({
    queryKey: ["setlists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setlists")
        .select("*, setlist_songs(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSetlist(id: string) {
  return useQuery({
    queryKey: ["setlist", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setlists")
        .select("*, setlist_songs(id, position, song:songs(*))")
        .eq("id", id)
        .single();
      if (error) throw error;
      const items = [...(data.setlist_songs ?? [])].sort((a, b) => a.position - b.position);
      return { ...data, items };
    },
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
