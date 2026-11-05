function LoadingScreen() {
  return <main className="brand-loading-screen" role="status" aria-label="Loading">
    <div className="brand-loading-content">
      <div className="brand-loading-frame">
        <img className="brand-loading-image" src="/prime-loader.jpg" alt="" fetchPriority="high" decoding="sync" />
        <span className="brand-loading-orbit" aria-hidden="true" />
      </div>
      <div className="brand-loading-copy">
        <strong>The Prime</strong>
        <span>Preparing your experience</span>
      </div>
      <div className="brand-loading-track" aria-hidden="true"><span /></div>
    </div>
  </main>
}

export default LoadingScreen
