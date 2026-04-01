import { useEffect } from 'react';
import { SystemDocumentationContent } from '@/components/admin/SystemDocumentationContent';

export default function SystemDocumentationPrintPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SystemDocumentationContent printMode={true} />
    </div>
  );
}
