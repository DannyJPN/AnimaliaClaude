import { useParams } from 'react-router';
import { lazy, Suspense } from 'react';
import EmptyPage from "../empty";

const DynamicReportPage = () => {
  const { reportPath } = useParams();
  
  if (!reportPath) {
    return <EmptyPage />;
  }

  // Import from the correct relative path
  const Component = lazy(() =>
    import(/* @vite-ignore */ `./${reportPath}`).catch(() => ({ default: EmptyPage }))
  );

  return (
    <Suspense fallback={<div>Načítavam...</div>}>
      <Component />
    </Suspense>
  );
};

export default DynamicReportPage;