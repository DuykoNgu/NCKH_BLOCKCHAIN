import { useState, useCallback } from "react";

interface ValidatorRegistration {
  id: string;
  org_name: string;
  tax_id: string;
  representative: string;
  email: string;
  phone: string;
  address_organization: string;
  agreement_file_url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  admin_notes?: string;
  approved_at?: string;
}

export function useAdminValidatorRegistrations() {
  const [registrations, setRegistrations] = useState<ValidatorRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/validator-registrations");
      if (!response.ok) {
        throw new Error("Failed to fetch registrations");
      }

      const data = (await response.json()) as ValidatorRegistration[];
      setRegistrations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch registrations";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveRegistration = useCallback(
    async (registrationId: string, adminNotes: string = "") => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/v1/validator-registrations/${registrationId}/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin_notes: adminNotes }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to approve registration");
        }

        const data = (await response.json()) as { data: ValidatorRegistration };

        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === registrationId
              ? { ...r, status: "approved", admin_notes: adminNotes, approved_at: new Date().toISOString() }
              : r
          )
        );

        setSuccess("Approved successfully");
        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to approve";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const rejectRegistration = useCallback(
    async (registrationId: string, reason: string) => {
      try {
        setLoading(true);
        setError(null);

        if (!reason.trim()) {
          throw new Error("Please provide a reason for rejection");
        }

        const response = await fetch(
          `/api/v1/validator-registrations/${registrationId}/reject`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to reject registration");
        }

        const data = (await response.json()) as { data: ValidatorRegistration };

        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === registrationId ? { ...r, status: "rejected", admin_notes: reason } : r
          )
        );

        setSuccess("Rejected successfully");
        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reject";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getRegistrationStatus = useCallback(
    async (taxId: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v1/validator-registrations/status/${taxId}`);

        if (!response.ok) {
          throw new Error("Registration not found");
        }

        const data = (await response.json()) as { data: ValidatorRegistration };
        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch status";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    registrations,
    loading,
    error,
    success,
    fetchRegistrations,
    approveRegistration,
    rejectRegistration,
    getRegistrationStatus,
    clearMessages,
  };
}
