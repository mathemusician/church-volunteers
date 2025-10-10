import { useState, useEffect } from 'react';

interface OrgContextData {
  organizationPublicId: string;
  organizationName: string;
}

export function useOrgContext() {
  const [orgContext, setOrgContext] = useState<OrgContextData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrgContext() {
      try {
        const response = await fetch('/api/org/context');
        if (response.ok) {
          const data = await response.json();
          setOrgContext(data);
        }
      } catch (error) {
        console.error('Error fetching org context:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrgContext();
  }, []);

  return { orgContext, loading };
}
