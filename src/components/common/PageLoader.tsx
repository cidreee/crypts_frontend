type PageLoaderProps = {
  visible: boolean;
  message?: string;
};

function PageLoader({ visible, message = "Cargando información..." }: PageLoaderProps) {
  if (!visible) return null;

  return (
    <div className="page-loader-overlay" role="status" aria-live="polite">
      <div className="page-loader-card">
        <span className="page-loader-orbit">
          <img src="/loader.png" alt="" aria-hidden="true" />
        </span>
        <strong>{message}</strong>
      </div>
    </div>
  );
}

export default PageLoader;
