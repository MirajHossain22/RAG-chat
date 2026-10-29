"use client";

import { useCallback, useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type DocumentRecord = {
  id: string;
  fileName: string;
  pageCount: number;
  createdAt: string;
};

export type UploadState =
  | { stage: "idle" }
  | { stage: "uploading"; progress: number }
  | { stage: "processing" }
  | { stage: "success"; message: string }
  | { stage: "error"; message: string };

type ApiDocument = {
  id: string;
  file_name: string;
  page_count: number;
  created_at: string;
};

function mapDocument(document: ApiDocument): DocumentRecord {
  return {
    id: document.id,
    fileName: document.file_name,
    pageCount: document.page_count,
    createdAt: document.created_at,
  };
}

async function readJson(response: Response) {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

export function useDocumentLibrary() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [accessToken, setAccessToken] = useState<string>();
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string>();
  const [uploadState, setUploadState] = useState<UploadState>({ stage: "idle" });
  const [libraryError, setLibraryError] = useState<string>();

  const loadDocuments = useCallback(async (token: string) => {
    const response = await fetch("/api/documents", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await readJson(response);

    if (!response.ok) {
      throw new Error(
        typeof body.error === "string"
          ? body.error
          : "Your documents could not be loaded.",
      );
    }

    const nextDocuments = Array.isArray(body.documents)
      ? (body.documents as ApiDocument[]).map(mapDocument)
      : [];
    setDocuments(nextDocuments);
    setSelectedDocumentIds(nextDocuments.map((document) => document.id));
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    async function initialize() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (!session || session.user.is_anonymous) {
          window.location.replace("/login");
          return;
        }
        if (!active) return;

        setAccessToken(session.access_token);
        await loadDocuments(session.access_token);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Unknown error";
        setLibraryError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void initialize();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;
        setAccessToken(session?.access_token);
        if (event === "SIGNED_OUT") window.location.replace("/login");
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadDocuments]);

  const uploadDocument = useCallback(
    async (file: File) => {
      if (!accessToken) {
        setUploadState({
          stage: "error",
          message: "Document authentication is not ready yet.",
        });
        return;
      }

      setLibraryError(undefined);
      setUploadState({ stage: "uploading", progress: 0 });

      try {
        const response = await new Promise<{
          document: ApiDocument;
          processing: { pages: number; chunks: number };
        }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append("file", file);

          xhr.open("POST", "/api/ingest");
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            setUploadState({
              stage: "uploading",
              progress: Math.round((event.loaded / event.total) * 100),
            });
          };
          xhr.upload.onload = () => setUploadState({ stage: "processing" });
          xhr.onerror = () => reject(new Error("The upload connection failed."));
          xhr.onload = () => {
            let body: Record<string, unknown> = {};
            try {
              body = JSON.parse(xhr.responseText) as Record<string, unknown>;
            } catch {
              // The status below still provides a useful fallback error.
            }

            if (xhr.status < 200 || xhr.status >= 300) {
              reject(
                new Error(
                  typeof body.error === "string"
                    ? body.error
                    : `Upload failed with status ${xhr.status}.`,
                ),
              );
              return;
            }

            resolve(body as {
              document: ApiDocument;
              processing: { pages: number; chunks: number };
            });
          };
          xhr.send(formData);
        });

        const document = mapDocument(response.document);
        setDocuments((current) => [
          document,
          ...current.filter((item) => item.id !== document.id),
        ]);
        setSelectedDocumentIds((current) =>
          current.includes(document.id) ? current : [document.id, ...current],
        );
        setUploadState({
          stage: "success",
          message: `${response.processing.pages} pages · ${response.processing.chunks} chunks`,
        });
      } catch (error) {
        setUploadState({
          stage: "error",
          message: error instanceof Error ? error.message : "Upload failed.",
        });
      }
    },
    [accessToken],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      if (!accessToken) return;

      setDeletingId(id);
      setLibraryError(undefined);

      try {
        const response = await fetch(`/api/documents/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const body = await readJson(response);

        if (!response.ok) {
          throw new Error(
            typeof body.error === "string"
              ? body.error
              : "The document could not be deleted.",
          );
        }

        setDocuments((current) => current.filter((item) => item.id !== id));
        setSelectedDocumentIds((current) =>
          current.filter((documentId) => documentId !== id),
        );
      } catch (error) {
        setLibraryError(
          error instanceof Error ? error.message : "Document deletion failed.",
        );
      } finally {
        setDeletingId(undefined);
      }
    },
    [accessToken],
  );

  const toggleDocument = useCallback((id: string) => {
    setSelectedDocumentIds((current) => {
      if (current.includes(id) && current.length === 1) return current;
      return current.includes(id)
        ? current.filter((documentId) => documentId !== id)
        : [...current, id];
    });
  }, []);

  const selectAllDocuments = useCallback(() => {
    setSelectedDocumentIds(documents.map((document) => document.id));
  }, [documents]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("/login");
  }, []);

  const dismissError = useCallback(() => {
    setLibraryError(undefined);
    setUploadState((current) =>
      current.stage === "error" ? { stage: "idle" } : current,
    );
  }, []);

  return {
    documents,
    selectedDocumentIds,
    accessToken,
    isLoading,
    deletingId,
    uploadState,
    libraryError,
    isReady: Boolean(accessToken),
    uploadDocument,
    deleteDocument,
    toggleDocument,
    selectAllDocuments,
    signOut,
    dismissError,
  };
}
